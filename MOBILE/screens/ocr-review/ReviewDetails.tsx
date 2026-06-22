import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { useThemeColors } from '@/theme/useThemeColors';
import { focusField } from '@/utils/a11y';
import { duration } from '@/tokens/motion';
import { radius, space } from '@/tokens/spacing';

import type { OcrReviewAction, OcrReviewState } from './state';

const ADDITIONAL_SECTION_HEIGHT = 196;

export interface ReviewDetailsProps {
  state: OcrReviewState;
  dispatch: React.Dispatch<OcrReviewAction>;
  firstFieldRef: React.RefObject<RNTextInput | null>;
  stepActive: boolean;
}

export function ReviewDetails({
  state,
  dispatch,
  firstFieldRef,
  stepActive,
}: ReviewDetailsProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const expandProgress = useSharedValue(0);

  useEffect(() => {
    expandProgress.value = withTiming(expanded ? 1 : 0, {
      duration: duration.base,
    });
  }, [expandProgress, expanded]);

  useEffect(() => {
    if (stepActive) {
      focusField(firstFieldRef);
    }
  }, [firstFieldRef, stepActive]);

  const additionalStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [0, ADDITIONAL_SECTION_HEIGHT]),
    opacity: expandProgress.value,
    overflow: 'hidden',
  }));

  const fields = [
    {
      key: 'fullName' as const,
      label: 'Name',
      autoCapitalize: 'words' as const,
    },
    {
      key: 'title' as const,
      label: 'Title',
      autoCapitalize: 'words' as const,
    },
    {
      key: 'company' as const,
      label: 'Company',
      autoCapitalize: 'words' as const,
    },
    {
      key: 'email' as const,
      label: 'Email',
      autoCapitalize: 'none' as const,
      keyboardType: 'email-address' as const,
    },
    {
      key: 'phone' as const,
      label: 'Phone',
      autoCapitalize: 'none' as const,
      keyboardType: 'phone-pad' as const,
    },
  ];

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
        Review details
      </Text>

      {fields.map((field, index) => (
        <TextInput
          key={field.key}
          fieldRef={index === 0 ? firstFieldRef : undefined}
          label={field.label}
          value={state[field.key]}
          onChangeText={(value) =>
            dispatch({ type: 'SET_FIELD', field: field.key, value })
          }
          autoCapitalize={field.autoCapitalize}
          keyboardType={field.keyboardType}
          accessibilityLabel={field.label}
          accessibilityHint={`Edit contact ${field.label.toLowerCase()}`}
          style={styles.field}
        />
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Additional details"
        accessibilityHint={
          expanded ? 'Collapse additional fields' : 'Expand additional fields'
        }
        onPress={() => setExpanded((current) => !current)}
        style={styles.additionalToggle}
      >
        <Text variant="bodyStrong" color={colors.tokens.primary[500]}>
          Additional details
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.tokens.primary[500]}
        />
      </Pressable>

      <Animated.View style={additionalStyle}>
        <TextInput
          label="Address"
          value={state.address}
          onChangeText={(value) =>
            dispatch({ type: 'SET_FIELD', field: 'address', value })
          }
          accessibilityLabel="Address"
          accessibilityHint="Optional mailing address"
          style={styles.field}
        />
        <TextInput
          label="Notes"
          value={state.notes}
          onChangeText={(value) =>
            dispatch({ type: 'SET_FIELD', field: 'notes', value })
          }
          multiline
          multilineMinHeight={96}
          accessibilityLabel="Notes"
          accessibilityHint="Optional contact notes"
          style={styles.field}
        />
      </Animated.View>
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
    marginBottom: space[3],
  },
  field: {
    marginBottom: space[1],
  },
  additionalToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[2],
    marginBottom: space[2],
  },
});
