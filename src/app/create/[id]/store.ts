import sdk from '@/lib/sdk';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useEmlStore } from '@/lib/stores/useEmlStore';
import {
  Blueprint,
  BlueprintProps,
  DecomposedRegex,
  DecomposedRegexPart,
  ValidationErrors,
  ZkFramework,
  ZodError,
} from '@zk-email/sdk';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import posthog from 'posthog-js';
import { getFileContent } from '@/lib/utils';
import { get, set } from 'idb-keyval';

type CreateBlueprintState = BlueprintProps & {
  blueprint: Blueprint | null;
  validationErrors: ValidationErrors;
  setField: (field: keyof BlueprintProps, value: any) => void;
  validateField: (field: keyof BlueprintProps) => void;
  validateAll: () => boolean;
  getParsedDecomposedRegexes: () => DecomposedRegex[];
  setToExistingBlueprint: (id: string) => void;
  compile: (skipValidation?: boolean) => Promise<string>;
  saveDraft: () => Promise<string>;
  reset: () => void;
  file: File | null;
  setFile: (file: File | null) => void;
};

const initialState: BlueprintProps = {
  id: '',
  title: '',
  description: '',
  slug: '',
  tags: [],
  emailQuery: '',
  circuitName: '',
  ignoreBodyHashCheck: false,
  shaPrecomputeSelector: '',
  emailBodyMaxLength: 1024,
  emailHeaderMaxLength: 10240,
  removeSoftLinebreaks: true,
  githubUsername: '',
  senderDomain: '',
  enableHeaderMasking: false,
  enableBodyMasking: false,
  isPublic: true,
  verifierContract: {
    chain: 84532,
    address: '',
  },
  externalInputs: [],
  decomposedRegexes: [],
  clientZkFramework: ZkFramework.Circom,
  serverZkFramework: ZkFramework.Circom,
};

export const useCreateBlueprintStore = create<CreateBlueprintState>()(
  persist(
    (set, get) => ({
      ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps),

      blueprint: null,
      validationErrors: {},
      file: null,

      setField: (field: keyof BlueprintProps, value: any) => {
        set({ [field]: value });
        get().validateField(field);
      },

      validateField: (field: keyof BlueprintProps) => {
        const state = get();
        try {
          // @ts-ignore
          const fieldSchema = Blueprint.formSchema.shape[field];
          if (fieldSchema) {
            fieldSchema.parse(state[field]);
            set((prev) => ({
              validationErrors: {
                ...prev.validationErrors,
                [field]: undefined,
              },
            }));
          }
        } catch (error) {
          if (error instanceof ZodError) {
            set((prev) => ({
              validationErrors: {
                ...prev.validationErrors,
                [field]: error.errors[0].message,
              },
            }));
          }
        }
      },

      validateAll: () => {
        const state = get();
        try {
          Blueprint.formSchema.parse(state);
          set({ validationErrors: {} });
          return true;
        } catch (error) {
          console.log('Validation error: ', error);
          if (error instanceof ZodError) {
            const errors: ValidationErrors = {};
            error.errors.forEach((err) => {
              const path = err.path[0] as keyof BlueprintProps;
              // @ts-ignore
              errors[path] = err.message;
            });
            set({ validationErrors: errors });
          }
          return false;
        }
      },

      getParsedDecomposedRegexes: (): DecomposedRegex[] => {
        const decomposedRegexes = get().decomposedRegexes;
        return decomposedRegexes.map((dcr) => {
          const parts =
            typeof dcr.parts === 'string'
              ? (JSON.parse((dcr.parts as unknown as string).trim()) as DecomposedRegexPart[])
              : dcr.parts;
          return {
            ...dcr,
            parts: parts,
          };
        });
      },
      saveDraft: async (): Promise<string> => {
        const state = get();
        const emlStore = useEmlStore.getState();
        const savedEmls = await emlStore.getAllEmls();

        // Remove functions from the state data and clone
        const data = JSON.parse(
          JSON.stringify(
            Object.fromEntries(
              Object.entries(state).filter(([_, value]) => typeof value !== 'function')
            )
          )
        ) as BlueprintProps;

        
        // Parse decomposedRegexes since we are saving them as string to make handling TextArea easier
        // TODO: need to add the maxmatch length and max length per public part in the client side for user
        data.decomposedRegexes?.forEach((dcr) => {
          dcr.parts =
          typeof dcr.parts === 'string'
          ? (JSON.parse((dcr.parts as unknown as string).trim()) as DecomposedRegexPart[])
          : dcr.parts;
          dcr.maxLength = dcr.maxLength || 64;
          dcr.maxMatchLength = dcr.maxMatchLength || 64;
          dcr.isHashed = dcr.isHashed || false;
          
          
          dcr.parts?.forEach((part) => {
            if (part.isPublic) {
              part.maxLength = part.maxLength || 64;
            }
          });
        });
        
        console.log('Creating blueprint with: ', data);

        const githubUserName = useAuthStore.getState().username;
        data.githubUsername = githubUserName ?? '';
        data.slug = `${data.githubUsername}/${data.circuitName}`;

        if (state.ignoreBodyHashCheck) {
          data.emailBodyMaxLength = 0;
        }

        try {
          console.log('saving draft with state: ', state);
          console.log('getting email content');
          let emlStr = '';
          if (state.file) {
            emlStr = await getFileContent(state.file);
          } else {
            emlStr = savedEmls[state.id ?? 'new'];
          }
          console.log('got email content');
          // Create a new blueprint
          if (!state.id || state.id === 'new') {
            console.log('creating a new blueprint');
            const blueprint = sdk.createBlueprint(data);
            if (emlStr) {
              await blueprint.assignPreferredZkFramework(emlStr);
            } else {
              data.clientZkFramework = ZkFramework.Noir;
              data.serverZkFramework = ZkFramework.Sp1;
            }
            console.log('Assigned clientZkFramework: ', blueprint.props.clientZkFramework);
            console.log('Assigned serverZkFramework: ', blueprint.props.serverZkFramework);
            await blueprint.submitDraft();
            console.log('saved draft');
            set({ blueprint });
            return blueprint.props.id!;
          }

          // Update an existing blueprint
          if (state.blueprint && state.blueprint.canUpdate(data)) {
            await state.blueprint.update(data);
            return state.blueprint.props.id!;
          }

          // Create a new version of an blueprint
          if (state.blueprint && !state.blueprint.canUpdate(data)) {
            console.log('creating new version');
            await state.blueprint.submitNewVersionDraft(data);
            return state.blueprint.props.id!;
          }

          throw new Error('Unknown error saving blueprint');
        } catch (err) {
          console.error('Failed to submit blueprint: ', err);
          throw err;
        }
      },
      setToExistingBlueprint: async (id: string) => {
        try {
          console.log('setting existing blueprint');
          const blueprint = await sdk.getBlueprintById(id);
          // blueprint?.props?.decomposedRegexes?.forEach((dcr) => {
          //   dcr.parts = JSON.stringify(dcr.parts) as unknown as DecomposedRegexPart[];
          // });

          // TODO: sdk should not return undefined fields - workaround so we have sane defaults
          for (const [key, value] of Object.entries(blueprint.props)) {
            if (value === undefined) {
              // @ts-ignore
              delete blueprint.props[key];
            }
          }

          set({
            ...blueprint.props,
            blueprint,
          });
        } catch (err) {
          console.error('Failed to get blueprint for id ', id);
          throw err;
        }
      },
      compile: async (skipValidation: boolean = false): Promise<string> => {
        const state = get();

        posthog.capture('$compile_blueprint', {
          state,
        });

        if (state.ignoreBodyHashCheck) {
          set({ emailBodyMaxLength: 0 });
          state.emailBodyMaxLength = 0;
        }

        try {
          if (!skipValidation && !state.validateAll()) {
            throw new Error('Validation failed');
          }
        } catch (err) {
          console.error('Validation failed: ', err);
          throw err;
        }
        // In theory we could also save before compiling here if we want, caling createBlueprint first
        if (!state.blueprint) {
          throw new Error('Blueprint must be saved first');
        }
        try {
          await state.blueprint.submit();
        } catch (err) {
          console.error('Failed to start blueprint compilation: ', err);
          throw err;
        }

        return state.blueprint.props.id!;
      },
      reset: () => {
        return set({
          ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps),
          file: null,
          blueprint: null,
          validationErrors: {},
        });
      },
      setFile: async (file: File | null) => {
        if (!file) {
          set({ file });
          return;
        }

        try {
          const content = await getFileContent(file);
          const emlStore = useEmlStore.getState();
          const state = get();

          // Save to IndexedDB if we have an ID
          if (state.id && state.id !== 'new') {
            await emlStore.setEml(state.id, content);
          }

          set({ file });
        } catch (err) {
          console.error('Failed to get file contents:', err);
          throw err;
        }
      },
    }),
    {
      name: 'create-blueprint',
      storage: {
        getItem: async (name) => {
          const value = await get(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await set(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await set(name, null);
        },
      },
    }
  )
);
