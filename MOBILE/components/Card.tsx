import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useThemeColors } from '@/theme/useThemeColors';
import { getElevationStyle, type ElevationLevel } from '@/tokens/elevation';
import { pressScale } from '@/utils/motion';
import { radius, space } from '@/tokens/spacing';

export type { ElevationLevel };

export { getElevationStyle };

export interface CardProps {
  elevation?: ElevationLevel;
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  elevation = 1,
  onPress,
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);

  const effectiveElevation = useMemo<ElevationLevel>(() => {
    if (!onPress || !isPressed) {
      return elevation;
    }
    return Math.min(elevation + 1, 3) as ElevationLevel;
  }, [elevation, isPressed, onPress]);

  const surfaceStyle = useMemo(
    () => getElevationStyle(colors.isDark, effectiveElevation, colors.surface),
    [colors.isDark, colors.surface, effectiveElevation],
  );

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    pressScale(scale, true);
    setIsPressed(true);
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    pressScale(scale, false);
    setIsPressed(false);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyle = [styles.card, surfaceStyle, style];

  if (onPress) {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: space[4],
  },
});
