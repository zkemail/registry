import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';

interface EmlStore {
  emls: Record<string, string>;
  getEml: (id: string) => Promise<string | undefined>;
  setEml: (id: string, eml: string) => Promise<void>;
  getAllEmls: () => Promise<Record<string, string>>;
  removeEml: (id: string) => Promise<void>;
}

const STORE_KEY = 'emls';

export const useEmlStore = create<EmlStore>((set) => ({
  emls: {},

  getEml: async (id: string) => {
    try {
      const eml = await idbGet(`eml-${id}`);
      return eml as string | undefined;
    } catch (error) {
      console.error('Failed to get EML:', error);
      return undefined;
    }
  },

  setEml: async (id: string, eml: string) => {
    try {
      await idbSet(`eml-${id}`, eml);
      const currentEmls = (await idbGet(STORE_KEY)) as Record<string, string> || {};
      const updatedEmls = { ...currentEmls, [id]: eml };
      await idbSet(STORE_KEY, updatedEmls);
      set({ emls: updatedEmls });
    } catch (error) {
      console.error('Failed to set EML:', error);
    }
  },

  getAllEmls: async () => {
    try {
      const emls = (await idbGet(STORE_KEY)) as Record<string, string> || {};
      set({ emls });
      return emls;
    } catch (error) {
      console.error('Failed to get all EMLs:', error);
      return {};
    }
  },

  removeEml: async (id: string) => {
    try {
      await idbSet(`eml-${id}`, undefined);
      const currentEmls = (await idbGet(STORE_KEY)) as Record<string, string> || {};
      const { [id]: _removed, ...remainingEmls } = currentEmls;
      await idbSet(STORE_KEY, remainingEmls);
      set({ emls: remainingEmls });
    } catch (error) {
      console.error('Failed to remove EML:', error);
    }
  },
})); 