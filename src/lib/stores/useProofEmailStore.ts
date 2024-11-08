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
        if (!proofEmail.status) {
          throw new Error('Unknown error, proofProps have no status');
        }

        // Get the proof first to then track the status async and wait for completion
        // After completion updates the store
        if (proofEmail.status === ProofStatus.InProgress) {
          return new Promise(async (resolve, reject) => {
            try {
              const proof = await sdk.getProof(proofEmail.id);
              console.log('got new proof: ', proof);
              // checkStatus internally has a setTimeout
              while ((await proof.checkStatus()) === ProofStatus.InProgress) {}
              const status = await proof.checkStatus();

              // Get updated proof
              const newProof = await sdk.getProof(proofEmail.id);
              console.log('got the new proof: ', newProof);

              set((state: ProofEmailState) => {
                // Ensure the blueprintId exists
                state.data[proofEmail.blueprintId][proof.props.id] = {
                  ...newProof.props,
                  email: proofEmail.email,
                };
              });
              resolve(status);
            } catch (err) {
              console.error('failed to get proof and track status');
              reject(err);
            }
          });
          // Immedeately resolve proof
        } else {
          return Promise.resolve(proofEmail.status);
        }
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
