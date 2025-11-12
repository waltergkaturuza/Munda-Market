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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'munda-auth-storage',
    }
  )
);

