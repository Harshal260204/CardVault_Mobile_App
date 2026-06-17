import { create } from 'zustand';

import type { UserProfile } from '@/lib/types';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setUser: (user: UserProfile | null) => void;
  setHydrated: (hydrated: boolean) => void;
  setSession: (
    user: UserProfile,
    accessToken: string,
    refreshToken: string,
  ) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
  setSession: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, hydrated: true }),
  clearSession: () =>
    set({ user: null, accessToken: null, refreshToken: null, hydrated: true }),
}));
