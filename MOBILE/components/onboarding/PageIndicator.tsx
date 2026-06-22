import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/theme/useThemeColors';
import { duration } from '@/tokens/motion';
import { space } from '@/tokens/spacing';

const DOT_HEIGHT = 8;
const DOT_INACTIVE_WIDTH = 8;
const DOT_ACTIVE_WIDTH = 24;

interface PageIndicatorProps {
  count: number;
  activeIndex: number;
}

function PageDot({ active }: { active: boolean }) {
  const colors = useThemeColors();
  const width = useSharedValue(active ? DOT_ACTIVE_WIDTH : DOT_INACTIVE_WIDTH);

  useEffect(() => {
    width.value = withTiming(active ? DOT_ACTIVE_WIDTH : DOT_INACTIVE_WIDTH, {
      duration: duration.fast,
    });
  }, [active, width]);

  const dotStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        dotStyle,
        {
          backgroundColor: active
            ? colors.tokens.primary[500]
            : colors.tokens.neutral[200],
        },
      ]}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

export function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={`Page ${activeIndex + 1} of ${count}`}
      accessibilityLiveRegion="polite"
    >
      {Array.from({ length: count }, (_, index) => (
        <PageDot key={index} active={index === activeIndex} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    minHeight: 44,
  },
  dot: {
    height: DOT_HEIGHT,
    borderRadius: DOT_HEIGHT / 2,
  },
});
