import React, {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { BackHandler, StyleSheet, TextInput as RNTextInput, View } from 'react-native';
import PagerView, {
  PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';

import { Button } from '@/components/Button';
import { StepProgress } from '@/components/StepProgress';
import { useThemeColors } from '@/theme/useThemeColors';
import { getApiErrorMessage } from '@/lib/api-client';
import type { CaptureMode, EventSessionRecord, LeadQualifier } from '@/lib/types';
import { randomUuid } from '@/lib/uuid';
import { useContactSaveStore } from '@/stores/contact-save-store';
import { useSessionStore } from '@/stores/session-store';
import { space } from '@/tokens/spacing';
import { haptics } from '@/utils/haptics';
import { focusField } from '@/utils/a11y';

import { ClassificationStep } from '@/screens/contact-form/ClassificationStep';
import { CONTACT_STEP_NAMES } from '@/screens/contact-form/constants';
import { ContactInfoStep } from '@/screens/contact-form/ContactInfoStep';
import { IdentityStep } from '@/screens/contact-form/IdentityStep';
import { NotesStep } from '@/screens/contact-form/NotesStep';
import {
  ContactFieldErrors,
  ContactFormField,
  STEP_FIELDS,
  contactWizardReducer,
  initialContactWizardState,
  validateSingleField,
  validateStepFields,
} from '@/screens/contact-form/state';

export interface ContactFormValues {
  fullName: string;
  company: string;
  title: string;
  emailsText: string;
  phonesText: string;
  website: string;
  linkedinUrl: string;
  leadNote: string;
  followUpDate: string;
  notes: string;
  captureMode: CaptureMode;
  eventSessionId?: string;
  leadQualifier?: LeadQualifier;
}

export interface ContactFormSubmitPayload {
  fullName: string;
  company?: string;
  title?: string;
  emails?: string[];
  phones?: string[];
  website?: string;
  linkedinUrl?: string;
  leadNote?: string;
  followUpDate?: string;
  notes?: string;
  captureMode?: CaptureMode;
  eventSessionId?: string;
  leadQualifier?: LeadQualifier;
}

interface ContactFormProps {
  initialValues: ContactFormValues;
  sessions: EventSessionRecord[];
  submitLabel: string;
  showSaveAndAddAnother?: boolean;
  onSubmit: (
    payload: ContactFormSubmitPayload,
    meta: { addAnother: boolean },
  ) => Promise<void> | void;
}

function mapInitialValues(
  initial: ContactFormValues,
): Partial<ReturnType<typeof initialContactWizardState>> {
  const firstEmail =
    initial.emailsText
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .find(Boolean) ?? '';
  const firstPhone =
    initial.phonesText
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .find(Boolean) ?? '';

  const mergedNotes = [initial.notes, initial.leadNote].filter(Boolean).join('\n\n');

  return {
    fullName: initial.fullName,
    title: initial.title,
    company: initial.company,
    email: firstEmail,
    phone: firstPhone,
    website: initial.website,
    linkedinUrl: initial.linkedinUrl,
    notes: mergedNotes,
    leadQualifier: initial.leadQualifier ?? 'warm',
    eventSessionId: initial.eventSessionId,
    captureMode: initial.captureMode,
  };
}

function buildSubmitPayload(
  state: ReturnType<typeof initialContactWizardState>,
  sessions: EventSessionRecord[],
): ContactFormSubmitPayload {
  const selectedSession = sessions.find(
    (session) => session.id === state.eventSessionId,
  );
  const tagPrefix =
    state.tags.length > 0 ? `Tags: ${state.tags.join(', ')}\n\n` : '';
  const notesBody = state.notes.trim();
  const notes = `${tagPrefix}${notesBody}`.trim();

  return {
    fullName: state.fullName.trim(),
    company: state.company.trim() || undefined,
    title: state.title.trim() || undefined,
    emails: state.email.trim() ? [state.email.trim()] : undefined,
    phones: state.phone.trim() ? [state.phone.trim()] : undefined,
    website: state.website.trim() || undefined,
    linkedinUrl: state.linkedinUrl.trim() || undefined,
    notes: notes || undefined,
    captureMode: selectedSession?.mode ?? state.captureMode,
    eventSessionId: selectedSession?.id,
    leadQualifier: state.leadQualifier || undefined,
  };
}

export function ContactForm({
  initialValues,
  sessions,
  submitLabel,
  showSaveAndAddAnother = false,
  onSubmit,
}: ContactFormProps) {
  const colors = useThemeColors();
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const startSave = useContactSaveStore((s) => s.startSave);
  const markSynced = useContactSaveStore((s) => s.markSynced);
  const removeSave = useContactSaveStore((s) => s.removeSave);

  const pagerRef = useRef<PagerView>(null);
  const step0Ref = useRef<RNTextInput>(null);
  const step1Ref = useRef<RNTextInput>(null);
  const step3Ref = useRef<RNTextInput>(null);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [saveError, setSaveError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const resetState = useMemo(
    () =>
      initialContactWizardState({
        ...mapInitialValues(initialValues),
        eventSessionId: initialValues.eventSessionId ?? activeSessionId,
      }),
    [activeSessionId, initialValues],
  );

  const [state, dispatch] = useReducer(contactWizardReducer, resetState);

  const goToStep = useCallback((nextStep: number) => {
    const clamped = Math.max(0, Math.min(CONTACT_STEP_NAMES.length - 1, nextStep));
    setStep(clamped);
    setErrors({});
    setSaveError(undefined);
    pagerRef.current?.setPage(clamped);

    const stepRefs = [step0Ref, step1Ref, null, step3Ref] as const;
    const fieldRef = stepRefs[clamped];
    if (fieldRef) {
      focusField(fieldRef);
    }
  }, []);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      setStep(event.nativeEvent.position);
      setErrors({});
    },
    [],
  );

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) {
        goToStep(step - 1);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [goToStep, step]);

  const handleBlurField = useCallback(
    (field: ContactFormField) => {
      const message = validateSingleField(field, state);
      setErrors((current) => {
        const next = { ...current };
        if (message) {
          next[field] = message;
        } else {
          delete next[field];
        }
        return next;
      });
    },
    [state],
  );

  const handleNext = useCallback(() => {
    const stepErrors = validateStepFields(step, state);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      void haptics.warning();
      return;
    }
    goToStep(step + 1);
  }, [goToStep, state, step]);

  const handleSave = useCallback(
    async (addAnother: boolean) => {
      if (isSaving) {
        return;
      }

      const identityErrors = validateStepFields(0, state);
      if (Object.keys(identityErrors).length > 0) {
        setErrors(identityErrors);
        goToStep(0);
        return;
      }

      setIsSaving(true);
      setSaveError(undefined);

      const payload = buildSubmitPayload(state, sessions);
      const tempId = randomUuid();

      startSave(tempId, payload.fullName);
      await haptics.success();

      try {
        await onSubmit(payload, { addAnother });
        markSynced(tempId);

        if (addAnother) {
          dispatch({ type: 'RESET', payload: resetState });
          goToStep(0);
        }
      } catch (error) {
        removeSave(tempId);
        setSaveError(getApiErrorMessage(error));
      } finally {
        setIsSaving(false);
      }
    },
    [
      goToStep,
      isSaving,
      markSynced,
      onSubmit,
      removeSave,
      resetState,
      sessions,
      startSave,
      state,
    ],
  );

  const visibleErrors = useMemo(() => {
    const allowed = new Set(STEP_FIELDS[step] ?? []);
    return Object.fromEntries(
      Object.entries(errors).filter(([field]) =>
        allowed.has(field as ContactFormField),
      ),
    ) as ContactFieldErrors;
  }, [errors, step]);

  return (
    <View style={styles.root}>
      <StepProgress
        currentStep={step}
        totalSteps={CONTACT_STEP_NAMES.length}
        stepNames={CONTACT_STEP_NAMES}
      />

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
        overdrag
      >
        <View key="identity" style={styles.page}>
          <IdentityStep
            state={state}
            dispatch={dispatch}
            errors={visibleErrors}
            onBlurField={handleBlurField}
            firstFieldRef={step0Ref}
            stepActive={step === 0}
          />
        </View>
        <View key="contact" style={styles.page}>
          <ContactInfoStep
            state={state}
            dispatch={dispatch}
            errors={visibleErrors}
            onBlurField={handleBlurField}
            firstFieldRef={step1Ref}
            stepActive={step === 1}
          />
        </View>
        <View key="classification" style={styles.page}>
          <ClassificationStep
            state={state}
            dispatch={dispatch}
            sessions={sessions}
            activeSessionId={activeSessionId}
          />
        </View>
        <View key="notes" style={styles.page}>
          <NotesStep
            state={state}
            dispatch={dispatch}
            errors={visibleErrors}
            onBlurField={handleBlurField}
            firstFieldRef={step3Ref}
            stepActive={step === 3}
            onSave={() => handleSave(false)}
            onSaveAndAddAnother={
              showSaveAndAddAnother ? () => handleSave(true) : undefined
            }
            isSaving={isSaving}
            saveError={saveError}
            submitLabel={submitLabel}
            showSaveAndAddAnother={showSaveAndAddAnother}
          />
        </View>
      </PagerView>

      {step < 3 ? (
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          {step > 0 ? (
            <View style={styles.footerButton}>
              <Button
                variant="secondary"
                size="lg"
                label="Back"
                onPress={() => goToStep(step - 1)}
                fullWidth
                accessibilityLabel="Go to previous step"
              />
            </View>
          ) : null}
          <View style={styles.footerButton}>
            <Button
              variant="primary"
              size="lg"
              label="Next"
              onPress={handleNext}
              fullWidth
              accessibilityLabel="Continue to next step"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 520,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingTop: space[3],
    paddingBottom: space[4],
  },
  footerButton: {
    flex: 1,
  },
});
