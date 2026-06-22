import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { haptics } from '@/utils/haptics';
import { radius, space } from '@/tokens/spacing';

const COMMIT_THRESHOLD = 88;
const ARCHIVE_ACTION_WIDTH = 96;

export interface SwipeableArchiveRowProps {
  children: ReactNode;
  onArchive: () => void;
}

export function SwipeableArchiveRow({
  children,
  onArchive,
}: SwipeableArchiveRowProps) {
  const colors = useThemeColors();
  const translateX = useSharedValue(0);
  const thresholdHapticFired = useSharedValue(false);

  const fireThresholdHaptic = useCallback(() => {
    void haptics.medium();
  }, []);

  const commitArchive = useCallback(() => {
    onArchive();
  }, [onArchive]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((event) => {
      const next = Math.min(0, event.translationX);
      translateX.value = next;

      if (Math.abs(next) >= COMMIT_THRESHOLD && !thresholdHapticFired.value) {
        thresholdHapticFired.value = true;
        runOnJS(fireThresholdHaptic)();
      }
    })
    .onEnd(() => {
      thresholdHapticFired.value = false;

      if (Math.abs(translateX.value) >= COMMIT_THRESHOLD) {
        translateX.value = withSpring(-ARCHIVE_ACTION_WIDTH);
        runOnJS(commitArchive)();
        return;
      }

      translateX.value = withSpring(0);
    });

  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.archiveAction,
          { backgroundColor: colors.tokens.error.bg },
        ]}
      >
        <Ionicons
          name="archive-outline"
          size={20}
          color={colors.tokens.error.text}
        />
        <Text variant="caption" color={colors.tokens.error.text}>
          Archive
        </Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.foreground, foregroundStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    marginBottom: space[3],
  },
  archiveAction: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: space[4],
    flexDirection: 'row',
    gap: space[2],
  },
  foreground: {
    width: '100%',
  },
});
