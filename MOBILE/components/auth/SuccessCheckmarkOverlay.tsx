import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useThemeColors } from '@/theme/useThemeColors';
import { useCheckmarkDraw } from '@/utils/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHECK_PATH = 'M 34 52 L 48 66 L 74 38';
const CHECK_LENGTH = 52;

interface SuccessCheckmarkOverlayProps {
  visible: boolean;
  accessibilityLabel?: string;
}

export function SuccessCheckmarkOverlay({
  visible,
  accessibilityLabel = 'Success',
}: SuccessCheckmarkOverlayProps) {
  const colors = useThemeColors();
  const { width, height } = useWindowDimensions();
  const { animatedProps } = useCheckmarkDraw(visible, CHECK_LENGTH);

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.overlay,
        {
          width,
          height,
          backgroundColor: colors.tokens.primary[900],
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg
        width={108}
        height={108}
        viewBox="0 0 108 108"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Circle
          cx={54}
          cy={54}
          r={46}
          stroke={colors.tokens.success.text}
          strokeWidth={3}
          fill="none"
          opacity={0.35}
        />
        <AnimatedPath
          d={CHECK_PATH}
          stroke={colors.tokens.success.text}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
