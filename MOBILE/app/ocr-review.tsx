import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  StyleSheet,
  TextInput as RNTextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PagerView, {
  PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';

import { SuccessCheckmarkOverlay } from '@/components/auth/SuccessCheckmarkOverlay';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { StepProgress } from '@/components/StepProgress';
import { SkeletonCard } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { api } from '@/lib/api';
import {
  confirmOcrJob,
  fetchImageUrl,
  fetchOcrJob,
  getApiErrorMessage,
} from '@/lib/api-client';
import { captureLog } from '@/lib/capture-logger';
import {
  extractedFieldsSyncKey,
  mapOcrJobToForm,
  mergeFormWithMapped,
  normalizeExtractedFields,
} from '@/lib/ocr-form-mapper';
import { useSessionStore } from '@/stores/session-store';
import { space } from '@/tokens/spacing';
import { focusField, useAccessibilityFocus } from '@/utils/a11y';
import { haptics } from '@/utils/haptics';

import { OCR_STEP_NAMES } from '@/screens/ocr-review/constants';
import { LeadQualification } from '@/screens/ocr-review/LeadQualification';
import { ReviewDetails } from '@/screens/ocr-review/ReviewDetails';
import { SaveSummary } from '@/screens/ocr-review/SaveSummary';
import {
  initialOcrReviewState,
  ocrReviewReducer,
} from '@/screens/ocr-review/state';
import { VerifyExtraction } from '@/screens/ocr-review/VerifyExtraction';

function isReviewReady(status: string): boolean {
  return status === 'completed' || status === 'manual_fallback';
}

const SUCCESS_ANIMATION_MS = 600;

export default function OcrReviewScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const qc = useQueryClient();
  const { height: screenHeight } = useWindowDimensions();
  const activeEncounterType = useSessionStore((s) => s.activeEncounterType);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const pagerRef = useRef<PagerView>(null);
  const sheetHeadingRef = useRef<View>(null);
  const step0Ref = useRef<RNTextInput>(null);
  const step1Ref = useRef<RNTextInput>(null);
  const step2Ref = useRef<RNTextInput>(null);

  const [step, setStep] = useState(0);
  const [state, dispatch] = useReducer(ocrReviewReducer, initialOcrReviewState);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [successVisible, setSuccessVisible] = useState(false);
  const lastHydratedKey = useRef<string | null>(null);

  const snapPoints = useMemo(() => ['90%'], []);

  const jobQuery = useQuery({
    queryKey: ['ocr-job', jobId],
    queryFn: () => fetchOcrJob(api, jobId!),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return 2000;
      if (data.status === 'pending' || data.status === 'processing') return 2000;
      if (isReviewReady(data.status)) {
        const mapped = mapOcrJobToForm(data);
        const ocrRan = data.meanConfidence != null && data.meanConfidence > 0.25;
        const missingContact = !mapped.email && !mapped.phone;
        if (ocrRan && missingContact) return 2000;
      }
      return false;
    },
  });

  const job = jobQuery.data;

  const imageQuery = useQuery({
    queryKey: ['card-image', job?.cardImageId],
    queryFn: () => fetchImageUrl(api, job!.cardImageId!),
    enabled: !!job?.cardImageId,
  });

  const normalizedFields = useMemo(() => {
    if (!job || !isReviewReady(job.status)) return null;
    return normalizeExtractedFields(job.extractedFields);
  }, [job?.id, job?.status, job?.extractedFields]);

  const fieldsSyncKey = useMemo(
    () => (normalizedFields ? extractedFieldsSyncKey(normalizedFields) : ''),
    [normalizedFields],
  );

  const mappedFromApi = useMemo(() => {
    if (!job || !isReviewReady(job.status)) return null;
    return mapOcrJobToForm(job);
  }, [
    job?.id,
    job?.status,
    job?.extractedFields,
    job?.primaryEmail,
    job?.primaryPhone,
    job?.rawText,
  ]);

  useEffect(() => {
    lastHydratedKey.current = null;
  }, [jobId]);

  useEffect(() => {
    if (!job || !mappedFromApi || !fieldsSyncKey) return;
    if (lastHydratedKey.current === fieldsSyncKey) return;

    lastHydratedKey.current = fieldsSyncKey;
    captureLog.reviewFormMapped(job.id, normalizedFields ?? {}, mappedFromApi);
    dispatch({ type: 'HYDRATE', payload: mappedFromApi });
  }, [fieldsSyncKey, job, mappedFromApi, normalizedFields]);

  const formValues = mergeFormWithMapped(
    {
      fullName: state.fullName,
      company: state.company,
      title: state.title,
      email: state.email,
      phone: state.phone,
      website: state.website,
    },
    mappedFromApi,
  );

  const duplicateMatch = job?.matches?.[0];

  useAccessibilityFocus(sheetHeadingRef, Boolean(job && isReviewReady(job.status)));

  const goToStep = useCallback((nextStep: number) => {
    const clamped = Math.max(0, Math.min(3, nextStep));
    setStep(clamped);
    pagerRef.current?.setPage(clamped);

    const stepRefs = [step0Ref, step1Ref, step2Ref] as const;
    const fieldRef = stepRefs[clamped];
    if (fieldRef) {
      focusField(fieldRef);
    }
  }, []);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      setStep(event.nativeEvent.position);
    },
    [],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) {
        goToStep(step - 1);
        return true;
      }
      bottomSheetRef.current?.close();
      router.back();
      return true;
    });
    return () => subscription.remove();
  }, [goToStep, router, step]);

  const confirm = useMutation({
    mutationFn: () =>
      confirmOcrJob(api, jobId!, {
        fullName: formValues.fullName.trim(),
        company: formValues.company.trim() || undefined,
        title: formValues.title.trim() || undefined,
        emails: formValues.email.trim() ? [formValues.email.trim()] : [],
        phones: formValues.phone.trim() ? [formValues.phone.trim()] : [],
        leadQualifier: state.leadQualifier || undefined,
        encounterType: activeEncounterType,
        duplicateAction: state.linkToContactId ? 'link' : 'new',
        linkToContactId: state.linkToContactId,
      }),
  });

  const handleSave = useCallback(
    async (scanNext: boolean) => {
      setSaveError(undefined);
      try {
        await confirm.mutateAsync();
        qc.invalidateQueries({ queryKey: ['contacts'] });
        await haptics.success();
        setSuccessVisible(true);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, SUCCESS_ANIMATION_MS);
        });
        bottomSheetRef.current?.close();
        if (scanNext) {
          router.replace('/(tabs)/home?openScanner=1');
        } else {
          router.replace('/(tabs)/contacts');
        }
      } catch (error) {
        setSaveError(getApiErrorMessage(error));
      } finally {
        setSuccessVisible(false);
      }
    },
    [confirm, qc, router],
  );

  const meanConfidencePercent =
    job?.meanConfidence != null ? Math.round(job.meanConfidence * 100) : null;

  if (jobQuery.isLoading || !job) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <SkeletonCard style={styles.processingSkeleton} />
        <Text variant="body" color={colors.muted} style={styles.statusText}>
          Processing scan…
        </Text>
      </View>
    );
  }

  if (job.status === 'failed') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="body" color={colors.tokens.error.text}>
          OCR failed. Try scanning again.
        </Text>
        <Button
          variant="primary"
          size="md"
          label="Go back"
          onPress={() => router.back()}
          style={styles.failedAction}
        />
      </View>
    );
  }

  if (!isReviewReady(job.status)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <SkeletonCard style={styles.processingSkeleton} />
        <Text variant="body" color={colors.muted} style={styles.statusText}>
          Status: {job.status}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.backdrop, { backgroundColor: colors.background }]}>
        <View style={styles.backdropContent}>
          <Text variant="h3" color={colors.text} accessibilityRole="header">
            Review scan
          </Text>
          <Text variant="caption" color={colors.muted}>
            Confirm extracted details before saving the contact.
          </Text>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableContentPanningGesture={false}
        onClose={() => router.back()}
        backgroundStyle={{
          backgroundColor: colors.getElevationSurface(1),
        }}
        handleIndicatorStyle={{ backgroundColor: colors.tokens.neutral[200] }}
      >
        <BottomSheetView style={[styles.sheet, { height: screenHeight * 0.88 }]}>
          <View
            ref={sheetHeadingRef}
            accessible
            accessibilityRole="header"
            accessibilityLabel="Review contact details"
          >
            <Text variant="h3" color={colors.text}>
              Review contact
            </Text>
          </View>

          <StepProgress
            currentStep={step}
            totalSteps={OCR_STEP_NAMES.length}
            stepNames={OCR_STEP_NAMES}
          />

          {step === 1 &&
          duplicateMatch &&
          !state.duplicateDismissed ? (
            <Banner
              variant="info"
              title="Possible duplicate"
              message={`Similar contact found: ${duplicateMatch.matchedContactName}${
                duplicateMatch.matchedContactCompany
                  ? `, ${duplicateMatch.matchedContactCompany}`
                  : ''
              }`}
              style={styles.duplicateBanner}
              actions={
                <>
                  <Button
                    variant={
                      state.linkToContactId === duplicateMatch.matchedContactId
                        ? 'primary'
                        : 'secondary'
                    }
                    size="sm"
                    label="Merge"
                    onPress={() => {
                      dispatch({
                        type: 'MERGE_DUPLICATE',
                        contactId: duplicateMatch.matchedContactId,
                      });
                      void haptics.selection();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    label="Keep Both"
                    onPress={() => {
                      dispatch({ type: 'KEEP_BOTH' });
                      void haptics.selection();
                    }}
                  />
                </>
              }
            />
          ) : null}

          <PagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={0}
            onPageSelected={handlePageSelected}
            overdrag
          >
            <View key="verify" style={styles.page}>
              <VerifyExtraction
                state={state}
                dispatch={dispatch}
                confidenceScores={job.confidenceScores ?? {}}
                imageUrl={imageQuery.data?.url}
                imageLoading={imageQuery.isLoading}
                meanConfidencePercent={meanConfidencePercent}
                firstFieldRef={step0Ref}
                stepActive={step === 0}
              />
            </View>
            <View key="details" style={styles.page}>
              <ReviewDetails
                state={state}
                dispatch={dispatch}
                firstFieldRef={step1Ref}
                stepActive={step === 1}
              />
            </View>
            <View key="lead" style={styles.page}>
              <LeadQualification
                state={state}
                dispatch={dispatch}
                firstFieldRef={step2Ref}
                stepActive={step === 2}
              />
            </View>
            <View key="save" style={styles.page}>
              <SaveSummary
                state={state}
                onSave={() => handleSave(false)}
                onSaveAndScanNext={() => handleSave(true)}
                isSaving={confirm.isPending}
              />
              {saveError ? (
                <Text
                  variant="caption"
                  color={colors.tokens.error.text}
                  style={styles.saveError}
                  accessibilityLiveRegion="assertive"
                  accessibilityRole="alert"
                >
                  {saveError}
                </Text>
              ) : null}
            </View>
          </PagerView>

          {step < 3 ? (
            <View style={styles.footer}>
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
                  label="Continue"
                  onPress={() => goToStep(step + 1)}
                  fullWidth
                  isDisabled={step === 0 && !state.fullName.trim()}
                  accessibilityLabel="Continue to next step"
                />
              </View>
            </View>
          ) : null}
        </BottomSheetView>
      </BottomSheet>

      <SuccessCheckmarkOverlay
        visible={successVisible}
        accessibilityLabel="Contact saved successfully"
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    paddingHorizontal: space[4],
    paddingTop: space[6],
  },
  backdropContent: {
    gap: space[2],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[6],
  },
  statusText: {
    marginTop: space[3],
  },
  processingSkeleton: {
    alignSelf: 'stretch',
    maxWidth: 420,
  },
  failedAction: {
    marginTop: space[4],
  },
  sheet: {
    flex: 1,
    paddingTop: space[3],
    gap: space[3],
  },
  duplicateBanner: {
    marginHorizontal: space[4],
    marginBottom: space[3],
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
  saveError: {
    textAlign: 'center',
    marginTop: space[2],
    paddingHorizontal: space[4],
  },
});
