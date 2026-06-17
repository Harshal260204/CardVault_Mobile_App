import AsyncStorage from '@react-native-async-storage/async-storage';

import { createApiClient } from '@/lib/api-client';
import { getApiHost, getAccessToken, setAccessToken } from '@/lib/api-config';
import { API_BASE_PATH, STORAGE_KEYS } from '@/lib/constants';
import type { UserProfile } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';

export { getApiHost, getAccessToken };

/** Full API base used by axios (e.g. http://192.168.0.106:8000/api/v1) */
export function getApiBaseUrl(): string {
  return `${getApiHost()}${API_BASE_PATH}`;
}

let refreshToken: string | null = null;

export async function loadStoredAuth(): Promise<UserProfile | null> {
  const [access, refresh, userRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    AsyncStorage.getItem(STORAGE_KEYS.USER),
  ]);
  setAccessToken(access);
  refreshToken = refresh;
  if (!userRaw) return null;
  try {
    return JSON.parse(userRaw) as UserProfile;
  } catch {
    return null;
  }
}

export const api = createApiClient({
  baseURL: getApiHost(),
  getAccessToken,
  getRefreshToken: () => refreshToken,
  onTokensRefreshed: async (access, refresh) => {
    setAccessToken(access);
    refreshToken = refresh;
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, access],
      [STORAGE_KEYS.REFRESH_TOKEN, refresh],
    ]);
  },
  onUnauthorized: async () => {
    await clearAuth();
    useAuthStore.getState().clearSession();
  },
});

export async function persistAuth(
  access: string,
  refresh: string,
  user: UserProfile,
): Promise<void> {
  setAccessToken(access);
  refreshToken = refresh;
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.ACCESS_TOKEN, access],
    [STORAGE_KEYS.REFRESH_TOKEN, refresh],
    [STORAGE_KEYS.USER, JSON.stringify(user)],
  ]);
}

export async function clearAuth(): Promise<void> {
  setAccessToken(null);
  refreshToken = null;
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);
}

export function getRefreshToken(): string | null {
  return refreshToken;
}
