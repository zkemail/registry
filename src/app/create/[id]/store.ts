import sdk from '@/lib/sdk';
import {
  Blueprint,
  BlueprintProps,
  DecomposedRegex,
  DecomposedRegexPart,
  Status,
} from '@zk-email/sdk';
import { create } from 'zustand';

type CreateBlueprintState = BlueprintProps & {
  blueprint: Blueprint | null;
  setField: (field: keyof BlueprintProps, value: any) => void;
  getParsedDecomposedRegexes: () => DecomposedRegex[];
  setToExistingBlueprint: (id: string) => void;
  compile: () => Promise<void>;
  saveDraft: () => Promise<string>;
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

export const useCreateBlueprintStore = create<CreateBlueprintState>()((set, get) => ({
  ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps),

  blueprint: null,

  setField: (field: keyof BlueprintProps, value: any) => set({ [field]: value }),
  getParsedDecomposedRegexes: (): DecomposedRegex[] => {
    console.log('parsing decomposed regex');
    const decomposedRegexes = get().decomposedRegexes;
    console.log('decomposedRegexes: ', decomposedRegexes);
    return get().decomposedRegexes.map((dcr) => {
      console.log('parsing: ', dcr.parts);
      const parts = JSON.parse((dcr.parts as unknown as string).trim()) as DecomposedRegexPart[];
      return {
        ...dcr,
        parts,
      };
    });
  },
  saveDraft: async (): Promise<string> => {
    console.log('saving draft');
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
        console.log('creating blueprint');
        const blueprint = sdk.createBlueprint(data);
        console.log('created a blueprint');
        await blueprint.submitDraft();
        console.log('submitting draft');
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
  compile: async (): Promise<void> => {
    const state = get();
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

    window.history.replaceState(null, '', '/');
  },
  reset: () => set({ ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps) }),
}));
