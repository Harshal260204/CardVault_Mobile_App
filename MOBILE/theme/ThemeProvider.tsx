import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { setReduceHapticsPreference } from '@/utils/haptics';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODE_KEY = 'cardvault_theme_mode';
const REDUCE_HAPTICS_KEY = 'cardvault_reduce_haptics';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  reduceHaptics: boolean;
  setReduceHaptics: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [reduceHaptics, setReduceHapticsState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_MODE_KEY),
      AsyncStorage.getItem(REDUCE_HAPTICS_KEY),
    ]).then(([savedMode, savedReduceHaptics]) => {
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setModeState(savedMode);
      }

      const reduceEnabled = savedReduceHaptics === 'true';
      setReduceHapticsState(reduceEnabled);
      setReduceHapticsPreference(reduceEnabled);
      setIsLoaded(true);
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_MODE_KEY, newMode).catch(console.warn);
  };

  const setReduceHaptics = (enabled: boolean) => {
    setReduceHapticsState(enabled);
    setReduceHapticsPreference(enabled);
    AsyncStorage.setItem(REDUCE_HAPTICS_KEY, String(enabled)).catch(
      console.warn,
    );
  };

  const resolvedTheme =
    mode === 'system' ? (systemColorScheme || 'light') : mode;

  const value = useMemo(
    () => ({
      mode,
      setMode,
      resolvedTheme,
      reduceHaptics,
      setReduceHaptics,
    }),
    [mode, reduceHaptics, resolvedTheme],
  );

  if (!isLoaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
