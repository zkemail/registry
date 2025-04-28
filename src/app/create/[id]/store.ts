import sdk from '@/lib/sdk';
import { useAuthStore } from '@/lib/stores/useAuthStore';
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

type CreateBlueprintState = BlueprintProps & {
  blueprint: Blueprint | null;
  validationErrors: ValidationErrors;
  setField: (field: keyof BlueprintProps, value: any) => void;
  validateField: (field: keyof BlueprintProps) => void;
  validateAll: () => boolean;
  getParsedDecomposedRegexes: () => DecomposedRegex[];
  setToExistingBlueprint: (id: string) => void;
  compile: () => Promise<string>;
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
  zkFramework: ZkFramework.Circom,
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
        const savedEmls = JSON.parse(localStorage.getItem('blueprintEmls') || '{}');

        // Page logic should already prevent saving a draft without having a file
        if (!state.file && !savedEmls[state.id ?? 'new']) {
          throw new Error('Can only save a draft with an example email provided');
        }

        // Remove functions from the state data and clone
        const data = JSON.parse(
          JSON.stringify(
            Object.fromEntries(
              Object.entries(state).filter(([_, value]) => typeof value !== 'function')
            )
          )
        ) as BlueprintProps;

        console.log('Creating blueprint with: ', data);

        // Parse decomposedRegexes since we are saving them as string to make handling TextArea easier
        data.decomposedRegexes?.forEach((dcr) => {
          dcr.parts =
            typeof dcr.parts === 'string'
              ? (JSON.parse((dcr.parts as unknown as string).trim()) as DecomposedRegexPart[])
              : dcr.parts;
          dcr.maxLength = dcr.maxLength || 64;
        });

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
            console.log('Assigned zkFramework: ', blueprint.props.zkFramework);
            await blueprint.submitDraft();
            console.log('saved draft');
            set({ blueprint });
            return blueprint.props.id!;
          }

          // Update an existing blueprint
          if (state.blueprint && state.blueprint.canUpdate()) {
            console.log('updating');
            await state.blueprint.update(data);
            return state.blueprint.props.id!;
          }

          // Create a new version of an blueprint
          if (state.blueprint && !state.blueprint.canUpdate()) {
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
      compile: async (): Promise<string> => {
        const state = get();

        posthog.capture('$compile_blueprint', {
          state,
        });

        if (state.ignoreBodyHashCheck) {
          set({ emailBodyMaxLength: 0 });
          state.emailBodyMaxLength = 0;
        }

        try {
          if (!state.validateAll()) {
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
      setFile: (file: File | null) => {
        set({ file });
      },
    }),
    {
      name: 'create-blueprint',
    }
  )
);
