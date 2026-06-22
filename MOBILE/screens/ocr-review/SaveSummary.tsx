import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { formatLeadLabel, initials } from '@/lib/format';
import { radius, space } from '@/tokens/spacing';

import type { OcrReviewState } from './state';

export interface SaveSummaryProps {
  state: OcrReviewState;
  onSave: () => void;
  onSaveAndScanNext: () => void;
  isSaving: boolean;
}

export function SaveSummary({
  state,
  onSave,
  onSaveAndScanNext,
  isSaving,
}: SaveSummaryProps) {
  const colors = useThemeColors();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text
        variant="h3"
        color={colors.text}
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        Save summary
      </Text>

      <Card elevation={1} style={styles.summaryCard}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.tokens.primary[100] },
          ]}
        >
          <Text variant="h3" color={colors.tokens.primary[700]}>
            {initials(state.fullName || '?')}
          </Text>
        </View>
        <View style={styles.summaryBody}>
          <Text variant="bodyStrong" color={colors.text} numberOfLines={2}>
            {state.fullName.trim() || 'Unnamed contact'}
          </Text>
          <Text variant="caption" color={colors.muted} numberOfLines={2}>
            {state.company.trim() || 'No company provided'}
          </Text>
          {state.title.trim() ? (
            <Text variant="caption" color={colors.muted} numberOfLines={1}>
              {state.title.trim()}
            </Text>
          ) : null}
          <Badge
            label={formatLeadLabel(state.leadQualifier || null)}
            lead={state.leadQualifier || null}
            style={styles.badge}
          />
        </View>
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        label="Save Contact"
        onPress={onSave}
        isLoading={isSaving}
        isDisabled={!state.fullName.trim()}
        accessibilityLabel="Save contact"
        style={styles.primaryAction}
      />
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        label="Save & Scan Next"
        onPress={onSaveAndScanNext}
        isDisabled={!state.fullName.trim() || isSaving}
        accessibilityLabel="Save contact and scan next card"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  sectionTitle: {
    marginBottom: space[4],
  },
  summaryCard: {
    flexDirection: 'row',
    gap: space[4],
    marginBottom: space[5],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: {
    flex: 1,
    gap: space[1],
  },
  badge: {
    marginTop: space[2],
  },
  primaryAction: {
    marginBottom: space[3],
  },
});
