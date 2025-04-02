import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  username: string | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
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
    }
  )
);
