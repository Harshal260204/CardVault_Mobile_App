/**
 * Core color tokens for the CardVault design system.
 * Contains light and dark modes with primary, neutral, accent, and semantic colors.
 */

export const lightColors = {
  primary: {
    900: '#0B1A33',
    700: '#16315C',
    500: '#2F5BB7',
    300: '#9DBBEE',
    100: '#E8EFFC',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F7F8FA',
    100: '#EEF0F4',
    200: '#E2E5EB',
    400: '#9AA1AE',
    600: '#5B6270',
    900: '#10131A',
  },
  accent: {
    500: '#FF7A45',
    100: '#FFE7DB',
  },
  success: {
    text: '#15803D',
    bg: '#E9F9EF',
  },
  warning: {
    text: '#B45309',
    bg: '#FFF4E5',
  },
  error: {
    text: '#B91C1C',
    bg: '#FEECEC',
  },
  info: {
    text: '#1D4ED8',
    bg: '#EAF1FE',
  },
} as const;

export const darkColors = {
  primary: {
    900: '#0B1A33',
    700: '#1E3A6E',
    500: '#5B8AE8',
    300: '#3A4F7A',
    100: '#16213A',
  },
  neutral: {
    0: '#0A0E16',
    50: '#11151F',
    100: '#171C28',
    200: '#1F2533',
    400: '#5A6172',
    600: '#8B92A3',
    900: '#F4F5F7',
  },
  accent: {
    500: '#FF7A45',
    100: '#FFE7DB',
  },
  success: {
    text: '#4ADE80',
    bg: '#102B1A',
  },
  warning: {
    text: '#FBBF24',
    bg: '#2E2008',
  },
  error: {
    text: '#F87171',
    bg: '#2E1212',
  },
  info: {
    text: '#60A5FA',
    bg: '#101E33',
  },
} as const;

export type Colors = typeof lightColors;
