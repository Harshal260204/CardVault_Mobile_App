import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api, clearAuth } from '@/lib/api';
import { logout as logoutApi } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/constants';
import type { UserProfile, UserRole } from '@/lib/types';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  status: 'idle' | 'authenticated' | 'unauthenticated';
  setSession: (
    user: UserProfile,
    accessToken: string,
    refreshToken: string,
  ) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      status: 'idle',
      setSession: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        set({ user, accessToken, status: 'authenticated' });
      },
      logout: () => {
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
            : null;
        void logoutApi(api, refreshToken).catch(() => undefined);
        clearAuth();
        set({ user: null, accessToken: null, status: 'unauthenticated' });
      },
      hasRole: (...roles) => {
        const role = get().user?.role;
        return role ? roles.includes(role) : false;
      },
    }),
    {
      name: 'cardvault-auth-store',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        status: s.status,
      }),
    },
  ),
);
