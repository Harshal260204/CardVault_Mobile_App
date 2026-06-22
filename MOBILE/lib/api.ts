import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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
  try {
    let access = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    let refresh = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    let userRaw = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

    if (!access && !refresh && !userRaw) {
      const [legacyAccess, legacyRefresh, legacyUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (legacyAccess || legacyRefresh || legacyUser) {
        if (legacyAccess)
          await SecureStore.setItemAsync(
            STORAGE_KEYS.ACCESS_TOKEN,
            legacyAccess,
          );
        if (legacyRefresh)
          await SecureStore.setItemAsync(
            STORAGE_KEYS.REFRESH_TOKEN,
            legacyRefresh,
          );
        if (legacyUser)
          await SecureStore.setItemAsync(STORAGE_KEYS.USER, legacyUser);

        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
        ]);

        access = legacyAccess;
        refresh = legacyRefresh;
        userRaw = legacyUser;
      }
    }

    setAccessToken(access || null);
    refreshToken = refresh || null;
    if (!userRaw) return null;

    return JSON.parse(userRaw) as UserProfile;
  } catch (error) {
    console.error('Error loading stored auth:', error);
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
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh),
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
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh),
    SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
  ]);
}

export async function clearAuth(): Promise<void> {
  setAccessToken(null);
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
  ]);
}

export function getRefreshToken(): string | null {
  return refreshToken;
}
