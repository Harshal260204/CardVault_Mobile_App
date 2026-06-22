import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  AnimatedProps,
  cancelAnimation,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { PathProps } from 'react-native-svg';

import {
  duration,
  entrance,
  shimmer,
  springs,
} from '@/tokens/motion';

export const springConfig = springs;

export type SpringPreset = keyof typeof springs;

const SHIMMER_START_OFFSET = -shimmer.bandWidth;

let reduceMotionEnabled = false;
let reduceMotionListenerAttached = false;

function attachReduceMotionListener(): void {
  if (reduceMotionListenerAttached) {
    return;
  }

  reduceMotionListenerAttached = true;

  void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
    reduceMotionEnabled = enabled;
  });

  AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
    reduceMotionEnabled = enabled;
  });
}

function useReduceMotionEnabled(): boolean {
  const [enabled, setEnabled] = useState(reduceMotionEnabled);

  useEffect(() => {
    attachReduceMotionListener();

    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      reduceMotionEnabled = value;
      setEnabled(value);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        reduceMotionEnabled = value;
        setEnabled(value);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return enabled;
}

export function pressScale(
  sharedValue: SharedValue<number>,
  pressed: boolean,
): void {
  attachReduceMotionListener();

  const target = pressed ? entrance.pressScale : 1;

  if (reduceMotionEnabled) {
    sharedValue.value = target;
    return;
  }

  sharedValue.value = withTiming(target, { duration: duration.instant });
}

export function useFadeIn(delay = 0) {
  const reduceMotion = useReduceMotionEnabled();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(
    reduceMotion ? 0 : entrance.fadeTranslateY,
  );

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateY.value = entrance.fadeTranslateY;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: duration.base }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: duration.base }),
    );
  }, [delay, opacity, reduceMotion, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

export function useShimmer(trackWidth: number) {
  const reduceMotion = useReduceMotionEnabled();
  const translateX = useSharedValue(SHIMMER_START_OFFSET);

  useEffect(() => {
    if (reduceMotion || trackWidth <= 0) {
      cancelAnimation(translateX);
      translateX.value = SHIMMER_START_OFFSET;
      return;
    }

    translateX.value = SHIMMER_START_OFFSET;
    translateX.value = withRepeat(
      withTiming(trackWidth + Math.abs(SHIMMER_START_OFFSET), {
        duration: duration.shimmer,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(translateX);
    };
  }, [reduceMotion, trackWidth, translateX]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
}

export interface CheckmarkDrawResult {
  animatedProps: Partial<AnimatedProps<PathProps>>;
}

export function useCheckmarkDraw(
  visible: boolean,
  pathLength: number,
): CheckmarkDrawResult {
  const reduceMotion = useReduceMotionEnabled();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      progress.value = 0;
      return;
    }

    if (reduceMotion) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withSpring(1, springConfig.gentle);
  }, [pathLength, progress, reduceMotion, visible]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength * (1 - progress.value),
  }));

  return { animatedProps };
}

export function useMotionReduced(): boolean {
  return useReduceMotionEnabled();
}
