import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { space } from '@/tokens/spacing';

export interface EmptyStateProps {
  illustration?: ReactNode;
  headline: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  illustration,
  headline,
  body,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      {illustration ? (
        <View style={styles.illustration}>{illustration}</View>
      ) : null}
      <Text
        variant="h3"
        color={colors.text}
        accessibilityRole="header"
        style={styles.headline}
      >
        {headline}
      </Text>
      <Text variant="body" color={colors.muted} style={styles.body}>
        {body}
      </Text>
      <Button
        variant="primary"
        size="lg"
        label={actionLabel}
        onPress={onAction}
        fullWidth
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[6],
    paddingVertical: space[8],
  },
  illustration: {
    marginBottom: space[6],
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    textAlign: 'center',
    marginBottom: space[2],
  },
  body: {
    textAlign: 'center',
    marginBottom: space[6],
    maxWidth: 320,
  },
  action: {
    maxWidth: 280,
  },
});
