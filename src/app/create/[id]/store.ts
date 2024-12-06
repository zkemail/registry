import sdk from '@/lib/sdk';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  Blueprint,
  BlueprintProps,
  DecomposedRegex,
  DecomposedRegexPart,
  Status,
} from '@zk-email/sdk';
import { create } from 'zustand';
import { z } from 'zod';
import { blueprintFormSchema } from './blueprintFormSchema';

type CreateBlueprintState = BlueprintProps & {
  blueprint: Blueprint | null;
  validationErrors: ValidationErrors;
  setField: (field: keyof BlueprintProps, value: any) => void;
  validateField: (field: keyof BlueprintProps) => void;
  validateAll: () => boolean;
  getParsedDecomposedRegexes: () => DecomposedRegex[];
  setToExistingBlueprint: (id: string) => void;
  compile: () => Promise<void>;
  saveDraft: () => Promise<string>;
  reset: () => void;
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
  isPublic: false,
  verifierContract: {
    chain: 84532,
    address: '',
  },
  externalInputs: [],
  decomposedRegexes: [],
};

export type ValidationErrors = {
  [K in keyof z.infer<typeof blueprintFormSchema>]?: string;
};

export const useCreateBlueprintStore = create<CreateBlueprintState>()((set, get) => ({
  ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps),

  blueprint: null,
  validationErrors: {},

  setField: (field: keyof BlueprintProps, value: any) => {
    set({ [field]: value });
    get().validateField(field);
  },

  validateField: (field: keyof BlueprintProps) => {
    const state = get();
    try {
      // @ts-ignore
      const fieldSchema = blueprintFormSchema.shape[field];
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
      if (error instanceof z.ZodError) {
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
      blueprintFormSchema.parse(state);
      set({ validationErrors: {} });
      return true;
    } catch (error) {
      console.log('Validation error: ', error);
      if (error instanceof z.ZodError) {
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
    return get().decomposedRegexes.map((dcr) => {
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

    // Remove functions from the state data and clone
    const data = JSON.parse(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(state).filter(([_, value]) => typeof value !== 'function')
        )
      )
    ) as BlueprintProps;

    console.log('Creting blueprint with: ', data);

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

    try {
      // Create a new blueprint
      if (!state.id || state.id === 'new') {
        const blueprint = sdk.createBlueprint(data);
        await blueprint.submitDraft();
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
        console.log('create');
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
      blueprint?.props?.decomposedRegexes?.forEach((dcr) => {
        dcr.parts = JSON.stringify(dcr.parts) as unknown as DecomposedRegexPart[];
      });
      set({ ...blueprint.props, blueprint });
    } catch (err) {
      console.error('Failed to get blueprint for id ', id);
      throw err;
    }
  },
  compile: async (): Promise<void> => {
    const state = get();

    if (state.ignoreBodyHashCheck) {
      set({ emailBodyMaxLength: 0 });
      state.emailBodyMaxLength = 0;
    }

    if (!state.validateAll()) {
      throw new Error('Validation failed');
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

    // const status = await state.blueprint.checkStatus()

    window.location.href = '/';
  },
  reset: () => set({ ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps) }),
}));
