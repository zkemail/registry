import { getFileContent } from '@/lib/utils';
import { Blueprint, ExternalInput, parseEmail, Proof } from '@zk-email/sdk';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore'; // Import the other store

export type Step = '0' | '1' | '2' | '3';

export type ExternalInputState = {
  name: string;
  value: string;
};

interface ProofState {
  step: Step;
  emailContent: string | null;
  // The actual text of the email file
  file: string | null;
  blueprint: Blueprint | null;
  externalInputs: ExternalInputState[] | null;
  // Actions
  setEmailContent: (content: string | null) => void;
  setStep: (step: Step) => void;
  setFile: (file: File) => Promise<void>;
  setExternalInputs: (inputs: ExternalInputState[]) => void;
  setBlueprint: (blueprint: Blueprint) => void;
  startProofGeneration: () => void;
  reset: () => void;
}

const initialState = {
  emailContent: null,
  step: '0' as Step,
  file: null,
  blueprint: null,
  externalInputs: null,
};

// seperate store
/*
useProofEmailStore
{
  addPoof(id, email)
  getProofs() {

  }

  blueprintId: {proofId: "email"}
}
 */

export const useProofStore = create<ProofState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setEmailContent: (content: string | null) => set({ file: content }),
      setExternalInputs: (inputs: ExternalInputState[]) => set({ externalInputs: inputs }),
      setStep: (step: Step) => {
        const params = new URLSearchParams();
        params.set('step', step.toString());
        window.history.pushState(null, '', `?${params.toString()}`);
        set({ step });
      },
      setFile: async (file: File) => {
        let content = '';
        try {
          content = await getFileContent(file);
          console.log('content: ', content);
        } catch (err) {
          console.error('Failed to get file contents: ', err);
          throw err;
          // TODO: Notify user about this
        }

        try {
          await parseEmail(content);
        } catch (err) {
          console.error('Failed to parse email, email is invalid: ', err);
          throw err;
          // TODO: Notify user about this, cannot go to next step, email is invalid
        }

        set({ file: content });
      },
      setBlueprint: (blueprint: Blueprint) => set({ blueprint }),
      // Starts the proof generation, waits for initial response and saves eml and proof to emailProofStrore
      startProofGeneration: async () => {
        console.log('starting proof generation');
        const { blueprint, file } = get();
        if (!blueprint) {
          throw new Error('Proof store not initialized yet, blueprint is not set');
        }
        if (!file) {
          throw new Error('File was not set yet');
        }

        // Create prover and generate proof
        const prover = blueprint.createProver();
        let proof: Proof;
        try {
          proof = await prover.generateProofRequest(file);
          // save proof.props with blueprint.props.id as proof on useProofEmailStore here
        } catch (err) {
          console.error('Failed to generate a proof request');
          throw err;
        }

        // Save proof to proofEmailStore
        useProofEmailStore.getState().addProof(blueprint.props.id!, proof.props.id, {
          ...proof.props,
          email: file,
        });
        console.log('added proof');
      },
      reset: () => set(initialState),
    }),
    {
      name: 'proof-storage',
    }
  )
);
