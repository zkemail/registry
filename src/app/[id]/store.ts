import { Blueprint } from '@dimidumo/zk-email-sdk-ts';
import { create } from 'zustand';

type Step = '0' | '1' | '2';

interface ProofState {
  emailContent: string | null;
  step: Step;
  file: string | null;
  blueprint: Blueprint | null;
  // Actions
  setEmailContent: (content: string | null) => void;
  setStep: (step: Step) => void;
  setFile: (file: string) => void;
  setBlueprint: (blueprint: Blueprint) => void;
  reset: () => void;
}

const initialState = {
  emailContent: null,
  step: '0' as Step,
  file: null,
  blueprint: null,
};

export const useProofStore = create<ProofState>((set) => ({
  ...initialState,
  setEmailContent: (content: string | null) => set({ emailContent: content }),
  setStep: (step: Step) => {
    const params = new URLSearchParams();
    params.set('step', step.toString());
    window.history.pushState(null, '', `?${params.toString()}`);
    set({ step });
  },
  setFile: (file: string) => set({ file }),
  setBlueprint: (blueprint: Blueprint) => set({ blueprint }),
  reset: () => set({ ...initialState }),
}));
