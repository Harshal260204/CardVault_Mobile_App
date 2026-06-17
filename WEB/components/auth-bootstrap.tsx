'use client';

import { useEffect, type ReactNode } from 'react';

import { useAuthProfile } from '@/hooks/use-auth-profile';
import { STORAGE_KEYS } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  const { data: profile } = useAuthProfile(
    status === 'authenticated' && Boolean(accessToken),
  );

  useEffect(() => {
    if (!profile || !accessToken) return;
    const refresh =
      typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        : null;
    if (!refresh) return;
    if (
      !user ||
      profile.id !== user.id ||
      profile.role !== user.role ||
      profile.fullName !== user.fullName
    ) {
      setSession(profile, accessToken, refresh);
    }
  }, [profile, accessToken, user, setSession]);

  return <>{children}</>;
}
