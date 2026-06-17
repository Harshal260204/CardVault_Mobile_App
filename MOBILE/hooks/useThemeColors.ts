import { useThemeStore } from '@/stores/theme-store';

export function useThemeColors() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  return {
    isDark,
    theme,
    primary: isDark ? '#0F172A' : '#1E3A5F',
    accent: '#3B82F6',
    background: isDark ? '#0F172A' : '#F4F6F8',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#334155' : '#E2E8F0',
    cardBorder: isDark ? '#334155' : '#E8F0F8',
    divider: isDark ? '#334155' : '#F1F5F9',
    badgeBg: isDark ? '#1E293B' : '#EFF6FF',
    badgeText: isDark ? '#2563EB' : '#2563EB', // Or accent
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    inputBg: isDark ? '#1E293B' : '#FFFFFF',
    tabBarBg: isDark ? '#1E293B' : '#FFFFFF',
    tabBarBorder: isDark ? '#334155' : '#E2E8F0',
    placeholder: isDark ? '#64748B' : '#94A3B8',
  };
}
