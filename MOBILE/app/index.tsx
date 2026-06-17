import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.primary,
        }}
      >
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/home" />;
}
