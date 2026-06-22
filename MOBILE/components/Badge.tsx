import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { radius, space } from '@/tokens/spacing';
import type { LeadQualifier } from '@/lib/types';

export type BadgeTone = 'hot' | 'warm' | 'cold' | 'neutral' | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  lead?: LeadQualifier | null;
  style?: ViewStyle;
}

function resolveTone(
  tone: BadgeTone | undefined,
  lead: LeadQualifier | null | undefined,
): BadgeTone {
  if (tone) return tone;
  if (lead === 'hot') return 'hot';
  if (lead === 'warm') return 'warm';
  if (lead === 'cold') return 'cold';
  return 'neutral';
}

export function Badge({ label, tone, lead, style }: BadgeProps) {
  const colors = useThemeColors();
  const resolved = resolveTone(tone, lead);

  const palette = {
    hot: {
      bg: colors.tokens.error.bg,
      text: colors.tokens.error.text,
    },
    warm: {
      bg: colors.tokens.warning.bg,
      text: colors.tokens.warning.text,
    },
    cold: {
      bg: colors.tokens.info.bg,
      text: colors.tokens.info.text,
    },
    info: {
      bg: colors.tokens.info.bg,
      text: colors.tokens.info.text,
    },
    neutral: {
      bg: colors.isDark
        ? colors.getElevationSurface(2)
        : colors.tokens.neutral[100],
      text: colors.isDark ? colors.tokens.primary[500] : colors.muted,
    },
  }[resolved];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <Text variant="micro" color={palette.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    alignSelf: 'flex-start',
    minHeight: 24,
    justifyContent: 'center',
  },
});
