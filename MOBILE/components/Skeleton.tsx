import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { getElevationStyle } from '@/components/Card';
import { KPI_CARD_WIDTH } from '@/components/KPICard';
import { SESSION_CARD_WIDTH } from '@/components/SessionCard';
import { useThemeColors } from '@/theme/useThemeColors';
import { useMotionReduced, useShimmer } from '@/utils/motion';
import { shimmer } from '@/tokens/motion';
import { typography } from '@/tokens/typography';
import { radius, space } from '@/tokens/spacing';

export interface SkeletonBaseProps {
  height: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

function SkeletonShimmer({ trackWidth }: { trackWidth: number }) {
  const colors = useThemeColors();
  const shimmerStyle = useShimmer(trackWidth);

  return (
    <Animated.View
      style={[styles.shimmerTrack, shimmerStyle]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', colors.tokens.neutral[200], 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );
}

export function SkeletonBase({
  height,
  width = '100%',
  borderRadius = radius.sm,
  style,
  accessibilityLabel = 'Loading',
}: SkeletonBaseProps) {
  const colors = useThemeColors();
  const reduceMotion = useMotionReduced();
  const [trackWidth, setTrackWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      onLayout={handleLayout}
      style={[
        styles.base,
        {
          height,
          width,
          borderRadius,
          backgroundColor: colors.tokens.neutral[100],
        },
        style,
      ]}
    >
      {reduceMotion ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: colors.tokens.neutral[200] },
          ]}
        />
      ) : trackWidth > 0 ? (
        <SkeletonShimmer trackWidth={trackWidth} />
      ) : null}
    </View>
  );
}

export interface SkeletonTextProps {
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonText({ lines = 3, style }: SkeletonTextProps) {
  const lineHeight = typography.body.lineHeight;

  return (
    <View style={style} accessibilityLabel="Loading text">
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonBase
          key={`line-${index}`}
          height={lineHeight}
          width={index === lines - 1 ? '70%' : '100%'}
          style={index > 0 ? styles.textLineGap : undefined}
          accessibilityLabel={`Loading text line ${index + 1}`}
        />
      ))}
    </View>
  );
}

export interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  const colors = useThemeColors();
  const surfaceStyle = getElevationStyle(colors.isDark, 1, colors.surface);

  return (
    <View
      style={[styles.activityCard, surfaceStyle, style]}
      accessibilityLabel="Loading activity item"
    >
      <SkeletonBase
        height={40}
        width={40}
        borderRadius={radius.full}
        accessibilityLabel="Loading avatar"
      />
      <View style={styles.activityBody}>
        <SkeletonBase height={typography.bodyStrong.lineHeight} width="58%" />
        <SkeletonBase
          height={typography.caption.lineHeight}
          width="38%"
          style={styles.blockGapSm}
        />
      </View>
      <SkeletonBase
        height={24}
        width={52}
        borderRadius={radius.sm}
        accessibilityLabel="Loading badge"
      />
    </View>
  );
}

export interface SkeletonKPICardProps {
  style?: ViewStyle;
}

export function SkeletonKPICard({ style }: SkeletonKPICardProps) {
  const colors = useThemeColors();
  const surfaceStyle = getElevationStyle(colors.isDark, 1, colors.surface);

  return (
    <View
      style={[styles.kpiCard, surfaceStyle, style]}
      accessibilityLabel="Loading KPI card"
    >
      <SkeletonBase
        height={typography.micro.lineHeight}
        width={72}
        accessibilityLabel="Loading KPI label"
      />
      <SkeletonBase
        height={36}
        width={88}
        style={styles.kpiValue}
        accessibilityLabel="Loading KPI value"
      />
      <SkeletonBase
        height={28}
        width={KPI_CARD_WIDTH - space[4] * 2}
        accessibilityLabel="Loading KPI trend"
      />
    </View>
  );
}

export interface SkeletonSessionCardProps {
  style?: ViewStyle;
}

export function SkeletonSessionCard({ style }: SkeletonSessionCardProps) {
  const colors = useThemeColors();
  const surfaceStyle = getElevationStyle(colors.isDark, 1, colors.surface);

  return (
    <View
      style={[styles.sessionCard, surfaceStyle, style]}
      accessibilityLabel="Loading session card"
    >
      <SkeletonBase
        height={48}
        width={48}
        borderRadius={radius.md}
        accessibilityLabel="Loading session thumbnail"
      />
      <SkeletonBase
        height={typography.h3.lineHeight}
        width="78%"
        style={styles.blockGap}
        accessibilityLabel="Loading session title"
      />
      <SkeletonBase
        height={typography.caption.lineHeight}
        width="55%"
        style={styles.blockGapSm}
        accessibilityLabel="Loading session subtitle"
      />
      <SkeletonBase
        height={28}
        width={28}
        borderRadius={radius.full}
        style={styles.sessionBadge}
        accessibilityLabel="Loading session count"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  shimmerTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: shimmer.bandWidth,
  },
  shimmerGradient: {
    flex: 1,
  },
  textLineGap: {
    marginTop: space[2],
  },
  blockGap: {
    marginTop: space[3],
  },
  blockGapSm: {
    marginTop: space[1],
  },
  kpiCard: {
    width: KPI_CARD_WIDTH,
    minHeight: 112,
    borderRadius: radius.lg,
    padding: space[4],
  },
  kpiValue: {
    marginTop: space[1],
    marginBottom: space[3],
  },
  sessionCard: {
    width: SESSION_CARD_WIDTH,
    minHeight: 148,
    borderRadius: radius.lg,
    padding: space[4],
    position: 'relative',
  },
  sessionBadge: {
    position: 'absolute',
    right: space[4],
    bottom: space[4],
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    borderRadius: radius.lg,
    padding: space[4],
    marginBottom: space[3],
  },
  activityBody: {
    flex: 1,
    paddingRight: space[2],
  },
});
