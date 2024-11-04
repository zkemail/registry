import { BlueprintProps, Status, ZkFramework } from '@dimidumo/zk-email-sdk-ts';
import { create } from 'zustand';

type CreateBlueprintState = BlueprintProps & {
  setField: (field: keyof BlueprintProps, value: any) => void;
};

export const useCreateBlueprintStore = create<CreateBlueprintState>((set) => ({
  id: '',
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
  zkFramework: ZkFramework.Circom,
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  externalInputs: [],
  decomposedRegexes: [],
  status: Status.Draft,
  verifierContract: {
    chain: 0,
  },
  version: 0,

  setField: (field: keyof BlueprintProps, value: any) => set({ [field]: value }),
}));
