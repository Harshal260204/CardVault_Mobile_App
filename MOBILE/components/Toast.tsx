import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { MIN_TOUCH_TARGET } from '@/utils/a11y';
import { radius, space } from '@/tokens/spacing';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  accessibilityLiveRegion?: 'polite' | 'assertive' | 'none';
  style?: ViewStyle;
}

export function Toast({
  message,
  variant = 'info',
  visible,
  accessibilityLiveRegion = 'polite',
  style,
}: ToastProps) {
  const colors = useThemeColors();

  useEffect(() => {
    if (!visible || accessibilityLiveRegion === 'none') {
      return;
    }

    AccessibilityInfo.announceForAccessibility(message);
  }, [accessibilityLiveRegion, message, visible]);

  if (!visible) {
    return null;
  }

  const palette = {
    info: colors.tokens.info,
    success: colors.tokens.success,
    warning: colors.tokens.warning,
    error: colors.tokens.error,
  }[variant];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion={accessibilityLiveRegion}
      accessibilityLabel={message}
      style={[
        styles.toast,
        { backgroundColor: palette.bg },
        style,
      ]}
    >
      <Text variant="bodyStrong" color={palette.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
});
