import { getFileContent } from '@/lib/utils';
import { Blueprint, ExternalInputInput, parseEmail, Proof } from '@zk-email/sdk';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore'; // Import the other store
import { useAuthStore } from '@/lib/stores/useAuthStore';
import sdk from '@/lib/sdk';

export type Step = '0' | '1' | '2' | '3';

interface ProofState {
  step: Step;
  emailContent: string | null;
  // The actual text of the email file
  file: string | null;
  blueprint: Blueprint | null;
  externalInputs: ExternalInputInput[] | null;
  // Actions
  setEmailContent: (content: string | null) => void;
  setStep: (step: Step) => void;
  setFile: (file: File | null) => Promise<void>;
  setExternalInputs: (inputs: ExternalInputInput[]) => void;
  setBlueprint: (blueprint: Blueprint) => void;
  startProofGeneration: (isLocal: boolean) => Promise<string>;
  reset: () => void;
  setIsUserStarred: () => Promise<void>;
  isUserStarred: boolean;
  starBlueprint: () => Promise<void>;
  unStarBlueprint: () => Promise<void>;
}

const initialState = {
  emailContent: null,
  step: '0' as Step,
  file: null,
  blueprint: null,
  externalInputs: null,
  isUserStarred: false,
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
      setExternalInputs: (inputs: ExternalInputInput[]) => set({ externalInputs: inputs }),
      setStep: (step: Step) => {
        const params = new URLSearchParams();
        params.set('step', step.toString());
        window.history.pushState(null, '', `?${params.toString()}`);
        set({ step });
      },
      setFile: async (file: File | null) => {
        if (!file) {
          set({ file: null });
          return;
        }
        let content = '';
        try {
          content = await getFileContent(file);
          console.log('content: ', content);

          if (content.includes('mail.protonmail.ch')) {
            console.log('Protonmail email detected');
            throw new Error('Protonmail emails are not supported yet');
          }
        } catch (err) {
          console.error('Failed to get file contents: ', err);
          throw err;
          // TODO: Notify user about this
        }

        const { blueprint } = get();

        try {
          // Use ignoreBodyHashCheck if already set
          await parseEmail(content, blueprint?.props.ignoreBodyHashCheck);
        } catch (err) {
          console.error('Failed to parse email, email is invalid: ', err);
          throw err;
          // TODO: Notify user about this, cannot go to next step, email is invalid
        }

        set({ file: content });
      },
      setBlueprint: (blueprint: Blueprint) => set({ blueprint }),
      setIsUserStarred: async () => {
        const token = useAuthStore.getState().token;
        if (!token) {
          return;
        }
        const { blueprint } = get();
        const userStarredSlugs = (await sdk.getStarredBlueprints()) || [];
        const isStared = userStarredSlugs.includes(blueprint!.props.slug!);
        set({ isUserStarred: isStared });
      },
      starBlueprint: async () => {
        const token = useAuthStore.getState().token;
        if (!token) {
          return;
        }
        const { blueprint } = get();
        await blueprint!.addStar();
        const userStarredSlugs = (await sdk.getStarredBlueprints()) || [];
        const isStared = userStarredSlugs.includes(blueprint!.props.slug!);
        set({ isUserStarred: isStared });
      },
      unStarBlueprint: async () => {
        const token = useAuthStore.getState().token;
        if (!token) {
          return;
        }
        const { blueprint } = get();
        await blueprint!.removeStar();
        const userStarredSlugs = (await sdk.getStarredBlueprints()) || [];
        const isStared = userStarredSlugs.includes(blueprint!.props.slug!);
        set({ isUserStarred: isStared });
      },
      // Starts the proof generation, waits for initial response and saves eml and proof to emailProofStrore
      startProofGeneration: async (isLocal = false) => {
        const { blueprint, file, externalInputs } = get();
        if (!blueprint) {
          throw new Error('Proof store not initialized yet, blueprint is not set');
        }
        if (!file) {
          throw new Error('File was not set yet');
        }

        // Create prover and generate proof
        const prover = blueprint.createProver({ isLocal });
        let proof: Proof;
        try {
          proof = await prover.generateProof(file, externalInputs || []);
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

        return proof.props.id;
      },
      reset: () => set(initialState),
    }),
    {
      name: 'proof-storage',
    }
  )
);
