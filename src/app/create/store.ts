import sdk from '@/lib/sdk';
import { BlueprintProps, DecomposedRegex, DecomposedRegexPart } from '@dimidumo/zk-email-sdk-ts';
import { create } from 'zustand';

type CreateBlueprintState = BlueprintProps & {
  setField: (field: keyof BlueprintProps, value: any) => void;
  getParsedDecomposedRegexes: () => DecomposedRegex[];
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
      const blueprint = sdk.createBlueprint(data);
      await blueprint.submitDraft();
      return blueprint.props.id!;
    } catch (err) {
      console.error('Failed to submit blueprint: ', err);
      throw err;
    }
  },
  reset: () => set({ ...(JSON.parse(JSON.stringify(initialState)) as BlueprintProps) }),
}));
