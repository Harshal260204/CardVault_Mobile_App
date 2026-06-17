import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: async (theme) => {
    set({ theme });
    try {
      await AsyncStorage.setItem('cardvault_theme', theme);
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
  },
  toggleTheme: async () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },
  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem('cardvault_theme');
      if (saved === 'light' || saved === 'dark') {
        set({ theme: saved });
      }
    } catch (e) {
      console.warn('Failed to load theme', e);
    }
  },
}));
