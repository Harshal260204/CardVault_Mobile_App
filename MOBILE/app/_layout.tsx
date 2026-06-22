import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadStoredAuth } from '@/lib/api';
import { COLORS } from '@/lib/constants';
import { startSyncListeners } from '@/lib/sync/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGate({ children, fontsLoaded }: { children: React.ReactNode; fontsLoaded: boolean }) {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    Promise.all([loadStoredAuth()]).then(([stored]) => {
      setUser(stored);
      setHydrated(true);
      setBooting(false);
    });
  }, [setUser, setHydrated]);

  useEffect(() => {
    if (!hydrated || booting || !fontsLoaded) return;
    
    // Hide splash screen once fonts and state are fully loaded
    SplashScreen.hideAsync();
    
    const inAuth = segments[0] === 'login';
    if (!user && !inAuth) {
      router.replace('/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)/home');
    }
  }, [user, hydrated, booting, fontsLoaded, segments, router]);

  if (booting || !hydrated || !fontsLoaded) {
    return null;
  }

  return <>{children}</>;
}

function ThemeAwareStatusBar() {
  const { resolvedTheme } = useTheme();
  return <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    const unsubscribe = startSyncListeners();
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeAwareStatusBar />
            <AuthGate fontsLoaded={fontsLoaded}>
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
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
