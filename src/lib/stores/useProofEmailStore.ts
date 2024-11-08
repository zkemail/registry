import { create } from 'zustand';

import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { set, get } from 'idb-keyval';
import { ProofProps, ProofStatus } from '@zk-email/sdk';
import sdk from '../sdk';

type Email = {
  email?: string;
};

type UpdatingStatus = {
  updatingStatus: Promise<ProofStatus>;
};

type ProofEmail = ProofProps & Email;

export type ProofEmailStatusUpdate = ProofEmail & UpdatingStatus;

interface ProofEmailState {
  data: {
    [blueprintId: string]: {
      [proofId: string]: ProofEmail;
    };
  };
  getProofIdsForBlueprint: (blueprintId: string) => string[];
  getUpdatingStatus: (proofEmail: ProofEmail) => Promise<ProofStatus>;
  // getProofEmailsForBlueprint: (blueprintId: string) => ProofEmailStatusUpdate[];
  addProof: (blueprintId: string, proofId: string, data: ProofEmail) => void;
}

export const useProofEmailStore = create<ProofEmailState>()(
  persist(
    immer((set, get) => ({
      data: {},
      getProofIdsForBlueprint(blueprintId: string): string[] {
        const state = get();
        const proofs = state.data[blueprintId];
        if (!proofs || !Object.keys(proofs).length) {
          return [];
        }

        return Object.values(proofs)
          .sort((a, b) => new Date(a.startedAt!).getTime() - new Date(b.startedAt!).getTime())
          .map((p) => p.id);
      },
      getUpdatingStatus(proofEmail: ProofEmail): Promise<ProofStatus> {
        if (!proofEmail || !proofEmail.id || !proofEmail.status) {
          throw new Error('Unknown error, proofProps have no status');
        }

        if (proofEmail.status !== ProofStatus.InProgress) {
          return Promise.resolve(proofEmail.status);
        }

        // Create an AbortController to handle cleanup
        const abortController = new AbortController();

        // Get the proof first to then track the status async and wait for completion
        // After completion updates the store
        const statusPromise = new Promise<ProofStatus>(async (resolve, reject) => {
          try {
            let status = proofEmail.status;
            const proof = await sdk.getProof(proofEmail.id);
            console.log('got new proof: ', proof);

            while (status === ProofStatus.InProgress && !abortController.signal.aborted) {
              status = await proof.checkStatus();
              console.log('current status: ', status);

              if (status === ProofStatus.InProgress) {
                await new Promise((resolve) => {
                  const timeoutId = setTimeout(resolve, 5000);
                  // Clear timeout if aborted
                  abortController.signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    resolve(undefined);
                  });
                });
              } else {
                set((state: ProofEmailState) => {
                  state.data[proofEmail.blueprintId][proof.props.id] = {
                    ...proof.props,
                    email: proofEmail.email,
                  };
                });
                resolve(status);
              }
            }
            // Resolve with current status if aborted
            if (abortController.signal.aborted) {
              resolve(status);
            }
          } catch (err) {
            console.error('failed to get proof and track status');
            reject(err);
          }
        });

        // Attach abort controller to the promise for cleanup
        (statusPromise as any).abort = () => abortController.abort();

        return statusPromise;
      },
      addProof: (blueprintId: string, proofId: string, data: ProofEmail) =>
        set((state: ProofEmailState) => {
          // Ensure the blueprintId exists
          if (!state.data[blueprintId]) {
            state.data[blueprintId] = {};
          }
          state.data[blueprintId][proofId] = data;
        }),
    })),
    {
      name: 'proof-email-store',
      storage: {
        getItem: async (name) => {
          const value = await get(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await set(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          // Implement remove logic if needed
        },
      },
    }
  )
);
