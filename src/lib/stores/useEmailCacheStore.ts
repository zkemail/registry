import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { RawEmailResponse } from '@/app/hooks/useGmailClient';

const CACHE_KEY = 'zk_email_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

type Email = RawEmailResponse & {
  valid: boolean;
};

interface CacheData {
  emails: Email[];
  timestamp: number;
  query: string;
}

interface EmailCacheStore {
  cacheData: CacheData | null;
  saveEmailsToCache: (emails: Email[], query: string) => Promise<void>;
  getEmailsFromCache: () => Promise<CacheData | null>;
  clearCache: () => Promise<void>;
}

export const useEmailCacheStore = create<EmailCacheStore>((set) => ({
  cacheData: null,

  saveEmailsToCache: async (emails: Email[], query: string) => {
    try {
      const cacheData: CacheData = {
        emails,
        timestamp: Date.now(),
        query,
      };
      await idbSet(CACHE_KEY, cacheData);
      set({ cacheData });
    } catch (error) {
      console.error('Failed to save emails to cache:', error);
    }
  },

  getEmailsFromCache: async () => {
    try {
      const cachedData = await idbGet(CACHE_KEY);
      if (!cachedData) return null;

      const data = cachedData as CacheData;
      const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY;

      if (isExpired) {
        await idbSet(CACHE_KEY, null);
        set({ cacheData: null });
        return null;
      }

      set({ cacheData: data });
      return data;
    } catch (error) {
      console.error('Failed to get emails from cache:', error);
      return null;
    }
  },

  clearCache: async () => {
    try {
      await idbSet(CACHE_KEY, null);
      set({ cacheData: null });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },
})); 