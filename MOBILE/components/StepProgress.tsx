import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { duration } from '@/tokens/motion';
import { space } from '@/tokens/spacing';

export interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  stepNames: readonly string[];
}

export function StepProgress({
  currentStep,
  totalSteps,
  stepNames,
}: StepProgressProps) {
  const colors = useThemeColors();
  const stepLabel = stepNames[currentStep] ?? `Step ${currentStep + 1}`;

  return (
    <View style={styles.container}>
      <View
        style={styles.trackRow}
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${currentStep + 1} of ${totalSteps}: ${stepLabel}`}
        accessibilityLiveRegion="polite"
        accessibilityValue={{
          min: 1,
          max: totalSteps,
          now: currentStep + 1,
        }}
      >
        {Array.from({ length: totalSteps }, (_, index) => (
          <StepSegment key={index} active={index === currentStep} />
        ))}
      </View>
      <Text variant="caption" color={colors.muted} style={styles.caption}>
        Step {currentStep + 1} of {totalSteps}: {stepLabel}
      </Text>
    </View>
  );
}

function StepSegment({ active }: { active: boolean }) {
  const colors = useThemeColors();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: duration.fast });
  }, [active, progress]);

  const segmentStyle = useAnimatedStyle(() => ({
    backgroundColor:
      progress.value > 0.5
        ? colors.tokens.primary[500]
        : colors.tokens.neutral[200],
    flex: progress.value > 0.5 ? 1.6 : 1,
  }));

  return <Animated.View style={[styles.segment, segmentStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space[4],
    paddingBottom: space[3],
    gap: space[2],
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 8,
  },
  segment: {
    height: 8,
    borderRadius: 999,
    flex: 1,
  },
  caption: {
    textAlign: 'center',
  },
});
