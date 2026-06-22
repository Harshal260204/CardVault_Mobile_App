import { useTheme } from './ThemeProvider';
import {
  getDarkElevationSurface,
  type ElevationLevel,
} from '../tokens/elevation';
import { lightColors, darkColors } from '../tokens/colors';

export function useThemeColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tokens = isDark ? darkColors : lightColors;

  const getElevationSurface = (level: ElevationLevel): string =>
    isDark ? getDarkElevationSurface(level) : tokens.neutral[0];

  return {
    isDark,
    theme: resolvedTheme,

    /**
     * SEMANTIC COLOR MAPPINGS & WCAG AA RATIONALES:
     *
     * - primary: Brand chrome background (primary[900]) for high-contrast light text.
     * - accent: Primary interactive accent (accent[500]).
     * - background: App canvas — neutral[50] (light) / neutral[0] (dark app bg).
     * - surface: Default raised surface — neutral[0] (light) / neutral[50] (dark elevation 1).
     * - text / muted: neutral[900] and neutral[600] scale across both modes.
     * - border / divider: Structural separators with ≥3:1 contrast on surfaces.
     */
    primary: tokens.primary[900],
    accent: tokens.accent[500],

    background: isDark ? tokens.neutral[0] : tokens.neutral[50],
    surface: isDark ? tokens.neutral[50] : tokens.neutral[0],
    cardBg: isDark ? tokens.neutral[50] : tokens.neutral[0],
    inputBg: isDark ? tokens.neutral[100] : tokens.neutral[0],
    tabBarBg: isDark ? tokens.neutral[50] : tokens.neutral[0],

    text: tokens.neutral[900],
    muted: tokens.neutral[600],
    placeholder: tokens.neutral[400],

    border: tokens.neutral[200],
    cardBorder: tokens.neutral[200],
    divider: isDark ? tokens.neutral[100] : tokens.neutral[100],
    tabBarBorder: tokens.neutral[200],

    /** Text on primary-tinted surfaces (e.g. chips, count badges). */
    primaryOnTint: isDark ? tokens.primary[500] : tokens.primary[700],

    badgeBg: tokens.info.bg,
    badgeText: tokens.info.text,

    getElevationSurface,

    tokens,
  };
}
