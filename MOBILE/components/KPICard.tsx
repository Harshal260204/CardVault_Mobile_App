import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { space } from '@/tokens/spacing';

export const KPI_CARD_WIDTH = 140;

const SPARKLINE_WIDTH = KPI_CARD_WIDTH - space[4] * 2;
const SPARKLINE_HEIGHT = 28;

export interface KPICardProps {
  value: string | number;
  label: string;
  trend?: number[];
  accentColor?: string;
  style?: ViewStyle;
}

function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const points = useMemo(() => {
    if (data.length === 0) {
      return '';
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    return data
      .map((value, index) => {
        const x =
          data.length === 1
            ? SPARKLINE_WIDTH / 2
            : (index / (data.length - 1)) * SPARKLINE_WIDTH;
        const y =
          SPARKLINE_HEIGHT -
          ((value - min) / range) * (SPARKLINE_HEIGHT - 4) -
          2;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function KPICard({
  value,
  label,
  trend,
  accentColor,
  style,
}: KPICardProps) {
  const colors = useThemeColors();
  const lineColor = accentColor ?? colors.tokens.primary[500];

  return (
    <Card elevation={1} style={[styles.card, style]}>
      <Text
        variant="micro"
        color={colors.muted}
        style={styles.label}
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        variant="display"
        color={colors.text}
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {trend && trend.length > 0 ? (
        <View style={styles.sparklineWrap}>
          <Sparkline data={trend} color={lineColor} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: KPI_CARD_WIDTH,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    marginTop: space[1],
  },
  sparklineWrap: {
    marginTop: space[3],
  },
});
