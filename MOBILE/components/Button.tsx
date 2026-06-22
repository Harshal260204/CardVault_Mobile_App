import React, { ReactNode, useState, useCallback } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useThemeColors } from '@/theme/useThemeColors';
import { haptics } from '@/utils/haptics';
import { pressScale } from '@/utils/motion';
import { radius, space } from '@/tokens/spacing';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  onPress,
  isLoading = false,
  isDisabled = false,
  icon,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const [fixedWidth, setFixedWidth] = useState<number | null>(null);

  const disabledState = isDisabled || isLoading;

  const handlePressIn = useCallback(() => {
    if (disabledState) return;
    void haptics.light();
    pressScale(scale, true);
  }, [disabledState, scale]);

  const handlePressOut = useCallback(() => {
    pressScale(scale, false);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabledState) return;
    onPress();
  }, [disabledState, onPress]);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      // Only capture the width when NOT loading so we can lock it during loading
      if (!isLoading && fixedWidth === null) {
        setFixedWidth(e.nativeEvent.layout.width);
      }
    },
    [isLoading, fixedWidth]
  );

  // Variant styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.tokens.accent[500],
          text: colors.tokens.neutral[0],
        };
      case 'secondary':
        return {
          bg: colors.isDark
            ? colors.getElevationSurface(2)
            : colors.tokens.neutral[100],
          text: colors.primaryOnTint,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: colors.tokens.primary[500],
        };
      case 'destructive':
        return {
          bg: colors.tokens.error.bg,
          text: colors.tokens.error.text,
        };
      default:
        return {
          bg: colors.tokens.accent[500],
          text: colors.tokens.neutral[0],
        };
    }
  };

  const { bg, text: textColor } = getVariantStyles();

  // Size styling
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: space[2], paddingHorizontal: space[3], minHeight: 44, minWidth: 44 };
      case 'lg':
        return { paddingVertical: space[4], paddingHorizontal: space[6], minHeight: 56 };
      case 'md':
      default:
        return { paddingVertical: space[3], paddingHorizontal: space[4], minHeight: 48 };
    }
  };

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hitSlop = size === 'sm' ? { top: 10, bottom: 10, left: 10, right: 10 } : undefined;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabledState, busy: isLoading }}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={onLayout}
      hitSlop={hitSlop}
      style={[
        styles.base,
        getSizeStyles(),
        { backgroundColor: bg },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        (isLoading && fixedWidth) ? { width: fixedWidth } : undefined,
        animatedStyles,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <View style={styles.iconWrapper} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {icon}
            </View>
          ) : null}
          <Text variant="bodyStrong" style={{ color: textColor }}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: space[2],
  },
});
