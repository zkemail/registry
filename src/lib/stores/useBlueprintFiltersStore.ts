import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Status } from '@zk-email/sdk';

interface BlueprintFiltersState {
  search: string;
  filters: Status[];
  sort: string;
  setSearch: (search: string) => void;
  setFilters: (filters: Status[]) => void;
  setSort: (sort: string) => void;
  clearFilters: () => void;
  updateFromUrl: (search: string, filters: Status[], sort: string) => void;
}

const initialState = {
  search: '',
  filters: [],
  sort: 'totalProofs',
};

export const useBlueprintFiltersStore = create<BlueprintFiltersState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSearch: (search: string) => set({ search }),
      
      setFilters: (filters: Status[]) => set({ filters }),
      
      setSort: (sort: string) => set({ sort }),
      
      clearFilters: () => set(initialState),
      
      updateFromUrl: (search: string, filters: Status[], sort: string) => {
        set({ search, filters, sort });
      },
    }),
    {
      name: 'blueprint-filters-storage',
      partialize: (state) => ({
        // Only persist filters and sort, not search
        filters: state.filters,
        sort: state.sort,
      }),
    }
  )
);
