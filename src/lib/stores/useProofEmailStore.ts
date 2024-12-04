import { create } from 'zustand';

import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { set, get } from 'idb-keyval';
import { Proof, ProofProps, ProofStatus } from '@zk-email/sdk';
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
  getUpdatingStatus: (
    proofEmail: ProofEmail,
    abortController: AbortController
  ) => Promise<ProofStatus>;
  // getProofEmailsForBlueprint: (blueprintId: string) => ProofEmailStatusUpdate[];
  addProof: (blueprintId: string, proofId: string, data: ProofEmail) => void;
  getProof: (proofId: string) => Promise<Proof>;
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
      async getProof(proofId: string): Promise<Proof> {
        const state = get();
        return sdk.getProof(proofId).then((proof) => {
          set((state: ProofEmailState) => {
            // Ensure the blueprintId exists first
            if (!state.data[proof.props.blueprintId]) {
              state.data[proof.props.blueprintId] = {};
            }
            state.data[proof.props.blueprintId][proof.props.id] = {
              ...state.data[proof.props.blueprintId][proof.props.id],
              ...proof.props,
            };
          });

          return proof;
        });
      },
      getUpdatingStatus(
        proofEmail: ProofEmail,
        abortController: AbortController
      ): Promise<ProofStatus> {
        if (!proofEmail || !proofEmail.status) {
          throw new Error('Unknown error, proofProps have no status');
        }

        if (proofEmail.status !== ProofStatus.InProgress) {
          return Promise.resolve(proofEmail.status);
        }

        // Get the proof first to then track the status async and wait for completion
        // After completion updates the store
        const statusPromise = new Promise<ProofStatus>(async (resolve, reject) => {
          try {
            let status = proofEmail.status;
            const proof = await sdk.getProof(proofEmail.id);

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
                const proofDetails = await sdk.getProof(proofEmail.id);

                set((state: ProofEmailState) => {
                  state.data[proofEmail.blueprintId][proof.props.id] = {
                    ...proofDetails.props,
                    email: proofEmail.email,
                  };
                });
                resolve(status);
              }
            }
            // Resolve with current status if aborted
            if (abortController.signal.aborted) {
              resolve(status ?? ProofStatus.Failed);
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
