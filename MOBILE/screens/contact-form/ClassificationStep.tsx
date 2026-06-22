import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { formatCaptureMode } from '@/lib/format';
import type { EventSessionRecord, LeadQualifier } from '@/lib/types';
import { radius, space } from '@/tokens/spacing';

import { CONTACT_TAG_OPTIONS } from './constants';
import type { ContactTag } from './constants';
import type { ContactWizardAction, ContactWizardState } from './state';

const LEAD_OPTIONS: { value: LeadQualifier; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

export interface ClassificationStepProps {
  state: ContactWizardState;
  dispatch: React.Dispatch<ContactWizardAction>;
  sessions: EventSessionRecord[];
  activeSessionId?: string;
}

export function ClassificationStep({
  state,
  dispatch,
  sessions,
  activeSessionId,
}: ClassificationStepProps) {
  const colors = useThemeColors();

  const selectedSession = useMemo(() => {
    const sessionId = state.eventSessionId ?? activeSessionId;
    return sessions.find((session) => session.id === sessionId);
  }, [activeSessionId, sessions, state.eventSessionId]);

  const sourceLabel = selectedSession
    ? `${selectedSession.name} · ${formatCaptureMode(selectedSession.mode)}`
    : formatCaptureMode(state.captureMode);

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
        style={styles.title}
      >
        Classification
      </Text>

      <Text variant="bodyStrong" color={colors.text} style={styles.label}>
        Lead status
      </Text>
      <SegmentedControl
        options={LEAD_OPTIONS}
        value={(state.leadQualifier || 'warm') as LeadQualifier}
        onChange={(value) => dispatch({ type: 'SET_LEAD', value })}
        accessibilityLabel="Lead status"
        style={styles.segmented}
      />

      <Text variant="bodyStrong" color={colors.text} style={styles.label}>
        Tags
      </Text>
      <View style={styles.tagWrap}>
        {CONTACT_TAG_OPTIONS.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            selected={state.tags.includes(tag)}
            onPress={() =>
              dispatch({ type: 'TOGGLE_TAG', tag: tag as ContactTag })
            }
          />
        ))}
      </View>

      <Text variant="bodyStrong" color={colors.text} style={styles.label}>
        Source / event
      </Text>
      <Card elevation={1} style={styles.sourceCard}>
        <Text variant="body" color={colors.text}>
          {sourceLabel}
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Change source or event"
          onPress={() =>
            dispatch({ type: 'SET_SHOW_SESSION_PICKER', value: true })
          }
          style={styles.changeLink}
        >
          <Text variant="bodyStrong" color={colors.tokens.primary[500]}>
            Change
          </Text>
        </Pressable>
      </Card>

      {state.showSessionPicker ? (
        <View style={styles.sessionPicker}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Standalone capture"
            onPress={() =>
              dispatch({
                type: 'SET_SESSION',
                sessionId: undefined,
                captureMode: 'legacy',
              })
            }
            style={[
              styles.sessionOption,
              { backgroundColor: colors.tokens.neutral[100] },
              !state.eventSessionId && {
                backgroundColor: colors.tokens.primary[100],
              },
            ]}
          >
            <Text variant="caption" color={colors.text}>
              Standalone
            </Text>
          </Pressable>
          {sessions.map((session) => {
            const selected = session.id === state.eventSessionId;
            return (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                accessibilityLabel={`Assign to ${session.name}`}
                onPress={() =>
                  dispatch({
                    type: 'SET_SESSION',
                    sessionId: session.id,
                    captureMode: session.mode,
                  })
                }
                style={[
                  styles.sessionOption,
                  { backgroundColor: colors.tokens.neutral[100] },
                  selected && { backgroundColor: colors.tokens.primary[100] },
                ]}
              >
                <Text variant="caption" color={colors.text}>
                  {session.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  title: {
    marginBottom: space[4],
  },
  label: {
    marginBottom: space[3],
  },
  segmented: {
    marginBottom: space[5],
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginBottom: space[5],
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  changeLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space[2],
  },
  sessionPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[3],
  },
  sessionOption: {
    borderRadius: radius.full,
    paddingHorizontal: space[3],
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
