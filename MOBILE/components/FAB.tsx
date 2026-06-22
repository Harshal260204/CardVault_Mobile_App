import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useThemeColors } from '@/theme/useThemeColors';
import { haptics } from '@/utils/haptics';
import { pressScale } from '@/utils/motion';
import { radius, space } from '@/tokens/spacing';

export interface FABProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FAB({
  icon = 'camera',
  onPress,
  accessibilityLabel,
  accessibilityHint = 'Opens the camera to capture a new contact',
  style,
}: FABProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    pressScale(scale, true);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    pressScale(scale, false);
  }, [scale]);

  const handlePress = useCallback(() => {
    void haptics.medium();
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fab,
        { backgroundColor: colors.tokens.primary[900] },
        animatedStyle,
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={colors.tokens.neutral[0]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: space[6],
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
});
