import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadStoredAuth } from '@/lib/api';
import { COLORS } from '@/lib/constants';
import { startSyncListeners } from '@/lib/sync/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    Promise.all([loadStoredAuth(), loadTheme()]).then(([stored]) => {
      setUser(stored);
      setHydrated(true);
      setBooting(false);
    });
  }, [setUser, setHydrated, loadTheme]);

  useEffect(() => {
    if (!hydrated || booting) return;
    const inAuth = segments[0] === 'login';
    if (!user && !inAuth) {
      router.replace('/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)/home');
    }
  }, [user, hydrated, booting, segments, router]);

  if (booting || !hydrated) {
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

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = startSyncListeners();
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AuthGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.primary },
              headerTintColor: '#fff',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="contact/create"
              options={{ title: 'Create contact' }}
            />
            <Stack.Screen name="contact/[id]" options={{ title: 'Contact' }} />
            <Stack.Screen
              name="contact/edit/[id]"
              options={{ title: 'Edit contact' }}
            />
            <Stack.Screen
              name="contact/[id]/relationships"
              options={{ title: 'Relationship history' }}
            />
            <Stack.Screen
              name="events/create"
              options={{ title: 'Create event' }}
            />
            <Stack.Screen
              name="events/[id]"
              options={{ title: 'Event details' }}
            />
            <Stack.Screen
              name="events/edit/[id]"
              options={{ title: 'Edit event' }}
            />
            <Stack.Screen
              name="encounter-select"
              options={{ title: 'Encounter type' }}
            />
            <Stack.Screen
              name="sessions/browse"
              options={{ title: 'Browse sessions' }}
            />
            <Stack.Screen
              name="sync-status"
              options={{ title: 'Sync status' }}
            />
            <Stack.Screen
              name="notifications"
              options={{ title: 'Notifications' }}
            />
            <Stack.Screen name="ocr-review" options={{ headerShown: false }} />
          </Stack>
        </AuthGate>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
