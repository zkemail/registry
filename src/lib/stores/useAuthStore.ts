import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  username: string | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  hasHydrated: boolean;
  setAuth: (username: string, token: string, isAdmin: boolean) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      username: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      hasHydrated: false,
      setAuth: (username, token, isAdmin) => set({ username, token, isAdmin }),
      clearAuth: () => set({ username: null, token: null, isAdmin: false }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        username: state.username,
        token: state.token,
        isAdmin: state.isAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);

// Cross-tab logout sync: clear Zustand store if token is removed in another tab
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth-storage') {
      // If the token is removed from localStorage, clear the Zustand store
      const newValue = event.newValue ? JSON.parse(event.newValue) : null;
      if (!newValue || !newValue.state || !newValue.state.token) {
        useAuthStore.getState().clearAuth();
      }
    }
  });
}
