/**
 * Typography scale for the CardVault design system.
 * Uses the Inter font family with predefined sizes and weights for consistency.
 */

export const typography = {
  display: {
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  bodyStrong: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
  },
  micro: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;

export type Typography = typeof typography;
