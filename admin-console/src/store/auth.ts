import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TOKEN_KEY, USER_KEY } from '@/config/constants';

export interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'OPS' | 'FINANCE';
  status: string;
  is_verified: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        set({ token, user, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ token: null, user: null, isAuthenticated: false });
      },
      initializeAuth: () => {
        // This function ensures auth state is properly initialized from localStorage
        const state = get();
        const token = localStorage.getItem(TOKEN_KEY);
        const userStr = localStorage.getItem(USER_KEY);
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            // Only update if state doesn't match localStorage
            if (state.token !== token || JSON.stringify(state.user) !== userStr) {
              set({ token, user, isAuthenticated: true });
            }
          } catch (e) {
            // Invalid user data, clear it
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            set({ token: null, user: null, isAuthenticated: false });
          }
        } else if (state.token || state.user) {
          // localStorage is empty but state has values, clear state
          set({ token: null, user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'munda-auth-storage',
      // On rehydrate, ensure isAuthenticated is computed correctly
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Compute isAuthenticated based on token and user
          const isAuthenticated = !!(state.token && state.user);
          state.isAuthenticated = isAuthenticated;
        }
      },
    }
  )
);

