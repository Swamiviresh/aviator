import { create } from 'zustand';

export type View = 'landing' | 'login' | 'register' | 'game' | 'admin';

interface User {
  id: number;
  username: string;
  balance: number;
  role: string;
  totalBets?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  view: View;
  setView: (view: View) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('aviator_token') : null,
  user: null,
  view: 'landing',

  setView: (view) => set({ view }),

  login: (token, user) => {
    if (typeof window !== 'undefined') localStorage.setItem('aviator_token', token);
    set({ token, user, view: 'game' });
  },

  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('aviator_token');
    set({ token: null, user: null, view: 'landing' });
  },

  updateBalance: (balance) => set((s) => ({ user: s.user ? { ...s.user, balance } : null })),

  updateUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
}));