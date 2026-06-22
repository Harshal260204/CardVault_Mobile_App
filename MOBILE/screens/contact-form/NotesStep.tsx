import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput as RNTextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { transcribeVoiceStub } from '@/lib/voice-to-text';
import { useThemeColors } from '@/theme/useThemeColors';
import { focusField } from '@/utils/a11y';
import { space } from '@/tokens/spacing';

import type {
  ContactFieldErrors,
  ContactFormField,
  ContactWizardAction,
  ContactWizardState,
} from './state';

export interface NotesStepProps {
  state: ContactWizardState;
  dispatch: React.Dispatch<ContactWizardAction>;
  errors: ContactFieldErrors;
  onBlurField: (field: ContactFormField) => void;
  firstFieldRef: React.RefObject<RNTextInput | null>;
  stepActive: boolean;
  onSave: () => void;
  onSaveAndAddAnother?: () => void;
  isSaving: boolean;
  saveError?: string;
  submitLabel: string;
  showSaveAndAddAnother: boolean;
}

export function NotesStep({
  state,
  dispatch,
  errors,
  onBlurField,
  firstFieldRef,
  stepActive,
  onSave,
  onSaveAndAddAnother,
  isSaving,
  saveError,
  submitLabel,
  showSaveAndAddAnother,
}: NotesStepProps) {
  const colors = useThemeColors();
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    if (stepActive) {
      focusField(firstFieldRef);
    }
  }, [firstFieldRef, stepActive]);

  const handleVoiceToText = async () => {
    setIsTranscribing(true);
    try {
      const transcript = await transcribeVoiceStub();
      const prefix = state.notes.trim();
      const nextValue = prefix ? `${prefix}\n${transcript}` : transcript;
      dispatch({ type: 'SET_FIELD', field: 'notes', value: nextValue });
    } finally {
      setIsTranscribing(false);
    }
  };

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
        Notes
      </Text>

      <TextInput
        fieldRef={firstFieldRef}
        label="Notes"
        value={state.notes}
        onChangeText={(value) =>
          dispatch({ type: 'SET_FIELD', field: 'notes', value })
        }
        onBlur={() => onBlurField('notes')}
        error={errors.notes}
        multiline
        multilineMinHeight={140}
        placeholder="Context, next steps, or meeting notes"
        accessibilityLabel="Notes"
        accessibilityHint="Optional notes about this contact"
        style={styles.field}
      />

      <Button
        variant="secondary"
        size="md"
        label={isTranscribing ? 'Listening…' : 'Voice to text'}
        icon={<Ionicons name="mic-outline" size={18} color={colors.text} />}
        onPress={handleVoiceToText}
        isDisabled={isTranscribing || isSaving}
        accessibilityLabel="Voice to text"
        fullWidth
        style={styles.voiceButton}
      />

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          label={submitLabel}
          onPress={onSave}
          isLoading={isSaving}
          isDisabled={isSaving}
          fullWidth
          accessibilityLabel={submitLabel}
        />
        {showSaveAndAddAnother && onSaveAndAddAnother ? (
          <Button
            variant="secondary"
            size="lg"
            label="Save & Add Another"
            onPress={onSaveAndAddAnother}
            isDisabled={isSaving}
            fullWidth
            accessibilityLabel="Save contact and add another"
            style={styles.secondaryAction}
          />
        ) : null}
      </View>

      {saveError ? (
        <Text
          variant="caption"
          color={colors.tokens.error.text}
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={styles.saveError}
        >
          {saveError}
        </Text>
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
  field: {
    marginBottom: space[3],
  },
  voiceButton: {
    marginBottom: space[5],
  },
  actions: {
    gap: space[3],
  },
  secondaryAction: {
    marginTop: 0,
  },
  saveError: {
    marginTop: space[3],
    textAlign: 'center',
  },
});
