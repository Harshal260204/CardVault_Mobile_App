import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { radius, space } from '@/tokens/spacing';

export type BannerVariant = 'info' | 'success' | 'warning';

export interface BannerProps {
  variant?: BannerVariant;
  title: string;
  message: string;
  actions?: ReactNode;
  style?: ViewStyle;
  accessibilityLiveRegion?: 'polite' | 'assertive' | 'none';
}

export function Banner({
  variant = 'info',
  title,
  message,
  actions,
  style,
  accessibilityLiveRegion = 'polite',
}: BannerProps) {
  const colors = useThemeColors();

  const palette = {
    info: {
      bg: colors.tokens.info.bg,
      text: colors.tokens.info.text,
      icon: 'information-circle-outline' as const,
    },
    success: {
      bg: colors.tokens.success.bg,
      text: colors.tokens.success.text,
      icon: 'checkmark-circle-outline' as const,
    },
    warning: {
      bg: colors.tokens.warning.bg,
      text: colors.tokens.warning.text,
      icon: 'alert-circle-outline' as const,
    },
  }[variant];

  const backgroundColor = colors.isDark
    ? colors.getElevationSurface(2)
    : palette.bg;

  return (
    <View
      style={[styles.banner, { backgroundColor }, style]}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message}`}
      accessibilityLiveRegion={accessibilityLiveRegion}
    >
      <Ionicons
        name={palette.icon}
        size={20}
        color={palette.text}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
      <View style={styles.content}>
        <Text
          variant="bodyStrong"
          color={palette.text}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <Text variant="caption" color={palette.text} style={styles.message}>
          {message}
        </Text>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    borderRadius: radius.lg,
    padding: space[4],
  },
  content: {
    flex: 1,
    gap: space[1],
  },
  message: {
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[3],
  },
});
