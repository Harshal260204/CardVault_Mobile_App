import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  accessToken: 'cardvault_access_token',
  refreshToken: 'cardvault_refresh_token',
  user: 'cardvault_user',
} as const;

export async function saveAuthSession(opts: {
  accessToken: string;
  refreshToken: string;
  userJson: string;
}): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.accessToken, opts.accessToken],
    [KEYS.refreshToken, opts.refreshToken],
    [KEYS.user, opts.userJson],
  ]);
}

export async function loadAuthSession(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  userJson: string | null;
}> {
  const pairs = await AsyncStorage.multiGet([
    KEYS.accessToken,
    KEYS.refreshToken,
    KEYS.user,
  ]);
  return {
    accessToken: pairs[0][1],
    refreshToken: pairs[1][1],
    userJson: pairs[2][1],
  };
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.accessToken,
    KEYS.refreshToken,
    KEYS.user,
  ]);
}
