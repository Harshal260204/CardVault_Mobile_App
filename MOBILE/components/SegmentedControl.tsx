import React, { useCallback, useMemo } from 'react';
import {
  AccessibilityActionEvent,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { MIN_TOUCH_TARGET } from '@/utils/a11y';
import { radius, space } from '@/tokens/spacing';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const colors = useThemeColors();

  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex((option) => option.value === value)),
    [options, value],
  );

  const selectedLabel = options[selectedIndex]?.label ?? value;

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (option) {
        onChange(option.value);
      }
    },
    [onChange, options],
  );

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'increment') {
        selectIndex(Math.min(selectedIndex + 1, options.length - 1));
        return;
      }

      if (event.nativeEvent.actionName === 'decrement') {
        selectIndex(Math.max(selectedIndex - 1, 0));
      }
    },
    [options.length, selectIndex, selectedIndex],
  );

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.isDark
            ? colors.getElevationSurface(2)
            : colors.tokens.neutral[100],
        },
        style,
      ]}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ?? 'Segmented control'}
      accessibilityValue={{ text: selectedLabel }}
      accessibilityHint="Swipe up or down to change the selected option"
      accessibilityActions={[
        { name: 'increment', label: 'Next option' },
        { name: 'decrement', label: 'Previous option' },
      ]}
      onAccessibilityAction={handleAccessibilityAction}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && {
                backgroundColor: colors.isDark
                  ? colors.getElevationSurface(3)
                  : colors.surface,
              },
            ]}
          >
            <Text
              variant="bodyStrong"
              color={selected ? colors.tokens.primary[500] : colors.muted}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: space[1],
    gap: space[1],
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[2],
  },
});
