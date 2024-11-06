import sdk from '@/lib/sdk';
import {
  Blueprint,
  BlueprintProps,
  DecomposedRegex,
  DecomposedRegexPart,
} from '@dimidumo/zk-email-sdk-ts';
import { create } from 'zustand';

type CreateBlueprintState = BlueprintProps & {
  blueprint: Blueprint | null;
  setField: (field: keyof BlueprintProps, value: any) => void;
  getParsedDecomposedRegexes: () => DecomposedRegex[];
  setToExistingBlueprint: (id: string) => void;
  compile: () => Promise<string>;
  submit: () => Promise<string>;
  reset: () => void;
};

const initialState: BlueprintProps = {
  title: '',
  description: '',
  slug: '',
  tags: [],
  emailQuery: '',
  circuitName: '',
  ignoreBodyHashCheck: false,
  shaPrecomputeSelector: '',
  emailBodyMaxLength: 0,
  emailHeaderMaxLength: 0,
  removeSoftLinebreaks: false,
  githubUsername: '',
  senderDomain: '',
  enableHeaderMasking: false,
  enableBodyMasking: false,
  isPublic: false,
  externalInputs: [],
  decomposedRegexes: [],
};

export const useCreateBlueprintStore = create<CreateBlueprintState>((set, get) => ({
  ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps),

  blueprint: null,

  setField: (field: keyof BlueprintProps, value: any) => set({ [field]: value }),
  getParsedDecomposedRegexes: (): DecomposedRegex[] => {
    return get().decomposedRegexes.map((dcr) => {
      const parts = JSON.parse((dcr.parts as unknown as string).trim()) as DecomposedRegexPart[];
      return {
        ...dcr,
        parts,
      };
    });
  },
  submit: async (): Promise<string> => {
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
    data.decomposedRegexes.forEach((dcr) => {
      dcr.parts = JSON.parse((dcr.parts as unknown as string).trim());
    });

    console.log('Cleaned decomposed regex: ', data);

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
        await state.blueprint.update(state);
        return state.blueprint.props.id!;
      }

      // Create a new version of an blueprint
      if (state.blueprint && !state.blueprint.canUpdate()) {
        await state.blueprint.submitNewVersionDraft(state);
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
      const blueprint = await sdk.getBlueprint(id);
      console.log('blueprint: ', blueprint);
      blueprint.props.decomposedRegexes.forEach((dcr) => {
        dcr.parts = JSON.stringify(dcr.parts) as unknown as DecomposedRegexPart[];
      });
      set({ ...blueprint.props, blueprint });
    } catch (err) {
      console.error('Failed to get blueprint for id ', id);
      throw err;
    }
  },
  compile: async () => {
    throw new Error('not implemented yet');
  },
  reset: () => set({ ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps) }),
}));
