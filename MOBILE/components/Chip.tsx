import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { radius, space } from '@/tokens/spacing';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  accessibilityHint?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  style,
  accessibilityHint = 'Double tap to toggle this tag',
}: ChipProps) {
  const colors = useThemeColors();

  const backgroundColor = selected
    ? colors.tokens.primary[100]
    : colors.isDark
      ? colors.getElevationSurface(3)
      : colors.tokens.neutral[100];

  const textColor = selected ? colors.primaryOnTint : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      hitSlop={4}
      style={[
        styles.chip,
        { backgroundColor },
        style,
      ]}
    >
      <Text variant="caption" color={textColor}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: radius.full,
    paddingHorizontal: space[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
