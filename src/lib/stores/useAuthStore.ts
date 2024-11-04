import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  username: string | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (username: string, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      username: null,
      token: null,
      isLoading: false,
      setAuth: (username, token) => set({ username, token }),
      clearAuth: () => set({ username: null, token: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        username: state.username,
        token: state.token,
      }),
    }
  )
);
