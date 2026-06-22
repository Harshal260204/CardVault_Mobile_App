/**
 * Animation and motion tokens for the CardVault design system.
 * Standardizes transition durations and spring physics.
 */

export const duration = {
  instant: 100,
  fast: 180,
  base: 250,
  slow: 400,
  shimmer: 1200,
} as const;

export const stagger = {
  step: 40,
  max: 200,
} as const;

export const entrance = {
  fadeTranslateY: 8,
  pressScale: 0.97,
} as const;

export const shimmer = {
  bandWidth: 96,
} as const;

export const springs = {
  snappy: {
    damping: 18,
    stiffness: 220,
    mass: 0.9,
  },
  fluid: {
    damping: 20,
    stiffness: 160,
    mass: 1,
  },
  gentle: {
    damping: 22,
    stiffness: 120,
    mass: 1,
  },
} as const;
