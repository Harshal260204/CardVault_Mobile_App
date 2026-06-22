/**
 * Elevation shadows and surface layers for the CardVault design system.
 * Light mode uses real shadows; dark mode maps elevation levels to neutral surfaces.
 */

import type { ViewStyle } from 'react-native';

import { darkColors } from './colors';

export type ElevationLevel = 0 | 1 | 2 | 3;

const DARK_ELEVATION_NEUTRAL_KEY: Record<
  ElevationLevel,
  keyof typeof darkColors.neutral
> = {
  0: 0,
  1: 50,
  2: 100,
  3: 200,
};

export function getDarkElevationSurface(level: ElevationLevel): string {
  return darkColors.neutral[DARK_ELEVATION_NEUTRAL_KEY[level]];
}

export const lightElevation = {
  0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export function getElevationStyle(
  isDark: boolean,
  level: ElevationLevel,
  lightSurfaceColor: string,
): ViewStyle {
  if (isDark) {
    return {
      backgroundColor: getDarkElevationSurface(level),
    };
  }

  return {
    backgroundColor: lightSurfaceColor,
    ...lightElevation[level],
  };
}
