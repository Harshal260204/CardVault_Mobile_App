import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, TextInput as RNTextInput } from 'react-native';

import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { useThemeColors } from '@/theme/useThemeColors';
import { focusField } from '@/utils/a11y';
import { space } from '@/tokens/spacing';

import type {
  ContactFieldErrors,
  ContactFormField,
  ContactWizardAction,
  ContactWizardState,
} from './state';

export interface IdentityStepProps {
  state: ContactWizardState;
  dispatch: React.Dispatch<ContactWizardAction>;
  errors: ContactFieldErrors;
  onBlurField: (field: ContactFormField) => void;
  firstFieldRef: React.RefObject<RNTextInput | null>;
  stepActive: boolean;
}

export function IdentityStep({
  state,
  dispatch,
  errors,
  onBlurField,
  firstFieldRef,
  stepActive,
}: IdentityStepProps) {
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
        style={styles.title}
      >
        Identity
      </Text>

      <TextInput
        fieldRef={firstFieldRef}
        label="Name"
        value={state.fullName}
        onChangeText={(value) =>
          dispatch({ type: 'SET_FIELD', field: 'fullName', value })
        }
        onBlur={() => onBlurField('fullName')}
        isRequired
        error={errors.fullName}
        autoCapitalize="words"
        accessibilityLabel="Name"
        accessibilityHint="Enter the contact name"
        style={styles.field}
      />

      <TextInput
        label="Title"
        value={state.title}
        onChangeText={(value) =>
          dispatch({ type: 'SET_FIELD', field: 'title', value })
        }
        onBlur={() => onBlurField('title')}
        isRequired
        error={errors.title}
        autoCapitalize="words"
        accessibilityLabel="Title"
        accessibilityHint="Enter the contact job title"
        style={styles.field}
      />

      <TextInput
        label="Company"
        value={state.company}
        onChangeText={(value) =>
          dispatch({ type: 'SET_FIELD', field: 'company', value })
        }
        onBlur={() => onBlurField('company')}
        isRequired
        error={errors.company}
        autoCapitalize="words"
        accessibilityLabel="Company"
        accessibilityHint="Enter the contact company"
        style={styles.field}
      />
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
  field: {
    marginBottom: space[1],
  },
});
