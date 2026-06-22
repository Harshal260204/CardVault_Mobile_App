import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { radius, space } from '@/tokens/spacing';

export const SESSION_CARD_WIDTH = 248;

export interface SessionCardProps {
  title: string;
  subtitle: string;
  contactCount: number;
  thumbnail?: ReactNode;
  onPress: () => void;
  children?: ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function SessionCard({
  title,
  subtitle,
  contactCount,
  thumbnail,
  onPress,
  children,
  style,
  accessibilityLabel,
}: SessionCardProps) {
  const colors = useThemeColors();

  const thumbnailBg = colors.isDark
    ? colors.getElevationSurface(2)
    : colors.tokens.neutral[100];

  const countBadgeBg = colors.isDark
    ? colors.getElevationSurface(3)
    : colors.tokens.primary[100];

  return (
    <Card
      elevation={1}
      onPress={onPress}
      style={[styles.card, style]}
      accessibilityLabel={accessibilityLabel ?? `${title}, ${contactCount} contacts`}
    >
      <View style={styles.headerSection}>
        <View style={styles.thumbnailWrap}>
          {thumbnail ?? (
            <View
              style={[
                styles.thumbnailFallback,
                { backgroundColor: thumbnailBg },
              ]}
            >
              <Text variant="h3" color={colors.muted}>
                {title.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text variant="h3" color={colors.text} style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text variant="caption" color={colors.muted} numberOfLines={2}>
          {subtitle}
        </Text>

        <View
          style={[
            styles.countBadge,
            { backgroundColor: countBadgeBg },
          ]}
        >
          <Text variant="micro" color={colors.primaryOnTint}>
            {contactCount}
          </Text>
        </View>
      </View>

      {children ? <View style={styles.children}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    width: SESSION_CARD_WIDTH,
  },
  headerSection: {
    position: 'relative',
    paddingBottom: space[1],
  },
  thumbnailWrap: {
    marginBottom: space[3],
  },
  thumbnailFallback: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: space[1],
    paddingRight: space[8],
  },
  countBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    minWidth: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[2],
  },
  children: {
    marginTop: space[4],
  },
});
