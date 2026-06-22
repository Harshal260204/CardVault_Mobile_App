import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';

import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { useThemeColors } from '@/theme/useThemeColors';
import { focusField } from '@/utils/a11y';
import { radius, space } from '@/tokens/spacing';

import { isLowConfidence } from './state';
import type { OcrReviewAction, OcrReviewState } from './state';

export interface VerifyExtractionProps {
  state: OcrReviewState;
  dispatch: React.Dispatch<OcrReviewAction>;
  confidenceScores: Record<string, number>;
  imageUrl?: string;
  imageLoading: boolean;
  meanConfidencePercent?: number | null;
  firstFieldRef: React.RefObject<RNTextInput | null>;
  stepActive: boolean;
}

export function VerifyExtraction({
  state,
  dispatch,
  confidenceScores,
  imageUrl,
  imageLoading,
  meanConfidencePercent,
  firstFieldRef,
  stepActive,
}: VerifyExtractionProps) {
  const colors = useThemeColors();

  useEffect(() => {
    if (stepActive) {
      focusField(firstFieldRef);
    }
  }, [firstFieldRef, stepActive]);

  const fields = [
    {
      key: 'fullName' as const,
      label: 'Full name',
      keyboardType: undefined,
      autoCapitalize: 'words' as const,
    },
    {
      key: 'company' as const,
      label: 'Company',
      keyboardType: undefined,
      autoCapitalize: 'words' as const,
    },
    {
      key: 'title' as const,
      label: 'Title',
      keyboardType: undefined,
      autoCapitalize: 'words' as const,
    },
    {
      key: 'email' as const,
      label: 'Email',
      keyboardType: 'email-address' as const,
      autoCapitalize: 'none' as const,
    },
    {
      key: 'phone' as const,
      label: 'Phone',
      keyboardType: 'phone-pad' as const,
      autoCapitalize: 'none' as const,
    },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.imageWrap,
          { backgroundColor: colors.tokens.neutral[100] },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Scanned business card"
          />
        ) : imageLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text variant="caption" color={colors.muted}>
            Card preview unavailable
          </Text>
        )}
        {meanConfidencePercent != null ? (
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: colors.tokens.warning.bg },
            ]}
          >
            <Text variant="micro" color={colors.tokens.warning.text}>
              {meanConfidencePercent}% extracted
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        variant="h3"
        color={colors.text}
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        Verify extraction
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
          onFocus={() =>
            dispatch({ type: 'CONFIRM_FIELD', field: field.key })
          }
          keyboardType={field.keyboardType}
          autoCapitalize={field.autoCapitalize}
          confidenceWarning={isLowConfidence(
            confidenceScores,
            field.key,
            state.confirmedFields,
          )}
          accessibilityLabel={field.label}
          accessibilityHint="Edit the OCR extracted value if needed"
          style={styles.field}
        />
      ))}
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
  imageWrap: {
    height: 160,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: space[4],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    position: 'absolute',
    top: space[3],
    right: space[3],
    borderRadius: radius.md,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  sectionTitle: {
    marginBottom: space[3],
  },
  field: {
    marginBottom: space[1],
  },
});
