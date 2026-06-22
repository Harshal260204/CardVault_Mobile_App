import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';

import { Chip } from '@/components/Chip';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { useThemeColors } from '@/theme/useThemeColors';
import { focusField } from '@/utils/a11y';
import { space } from '@/tokens/spacing';
import type { LeadQualifier } from '@/lib/types';

import { LEAD_TAG_OPTIONS } from './constants';
import type { LeadTag } from './constants';
import type { OcrReviewAction, OcrReviewState } from './state';

const LEAD_OPTIONS: { value: LeadQualifier; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

export interface LeadQualificationProps {
  state: OcrReviewState;
  dispatch: React.Dispatch<OcrReviewAction>;
  firstFieldRef: React.RefObject<RNTextInput | null>;
  stepActive: boolean;
}

export function LeadQualification({
  state,
  dispatch,
  firstFieldRef,
  stepActive,
}: LeadQualificationProps) {
  const colors = useThemeColors();

  useEffect(() => {
    if (stepActive) {
      focusField(firstFieldRef);
    }
  }, [firstFieldRef, stepActive]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text
        variant="h3"
        color={colors.text}
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        Lead qualification
      </Text>

      <SegmentedControl
        options={LEAD_OPTIONS}
        value={(state.leadQualifier || 'warm') as LeadQualifier}
        onChange={(value) => dispatch({ type: 'SET_LEAD', value })}
        accessibilityLabel="Lead temperature"
        style={styles.segmented}
      />

      <Text variant="bodyStrong" color={colors.text} style={styles.tagsTitle}>
        Tags
      </Text>
      <View style={styles.tagWrap}>
        {LEAD_TAG_OPTIONS.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            selected={state.tags.includes(tag)}
            onPress={() =>
              dispatch({ type: 'TOGGLE_TAG', tag: tag as LeadTag })
            }
          />
        ))}
      </View>

      <TextInput
        fieldRef={firstFieldRef}
        label="Lead notes"
        value={state.leadNotes}
        onChangeText={(value) =>
          dispatch({ type: 'SET_FIELD', field: 'leadNotes', value })
        }
        multiline
        multilineMinHeight={96}
        placeholder="Optional context for follow-up"
        accessibilityLabel="Lead notes"
        accessibilityHint="Optional notes about this lead"
        style={styles.notesField}
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
  segmented: {
    marginBottom: space[5],
  },
  tagsTitle: {
    marginBottom: space[3],
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginBottom: space[4],
  },
  notesField: {
    marginBottom: space[1],
  },
});
