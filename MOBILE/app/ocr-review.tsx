import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import {
  confirmOcrJob,
  fetchImageUrl,
  fetchOcrJob,
  getApiErrorMessage,
} from '@/lib/api-client';
import { captureLog } from '@/lib/capture-logger';
import { COLORS } from '@/lib/constants';
import {
  extractedFieldsSyncKey,
  mapOcrJobToForm,
  mergeFormWithMapped,
  normalizeExtractedFields,
} from '@/lib/ocr-form-mapper';
import type { LeadQualifier } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';

function isReviewReady(status: string): boolean {
  return status === 'completed' || status === 'manual_fallback';
}

export default function OcrReviewScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.isDark;
  const router = useRouter();
  const qc = useQueryClient();
  const activeEncounterType = useSessionStore((s) => s.activeEncounterType);
  const [showDuplicateBanner, setShowDuplicateBanner] = useState(true);

  const jobQuery = useQuery({
    queryKey: ['ocr-job', jobId],
    queryFn: () => fetchOcrJob(api, jobId!),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 2000;
      if (d.status === 'pending' || d.status === 'processing') return 2000;
      if (isReviewReady(d.status)) {
        const mapped = mapOcrJobToForm(d);
        const ocrRan = d.meanConfidence != null && d.meanConfidence > 0.25;
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
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [lead, setLead] = useState<LeadQualifier | ''>('warm');
  const [linkId, setLinkId] = useState<string | undefined>();
  const lastHydratedKey = useRef<string | null>(null);

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

    setFullName(mappedFromApi.fullName);
    setCompany(mappedFromApi.company);
    setTitle(mappedFromApi.title);
    setEmail(mappedFromApi.email);
    setPhone(mappedFromApi.phone);
    setWebsite(mappedFromApi.website);
  }, [job, fieldsSyncKey, mappedFromApi, normalizedFields]);

  const formValues = mergeFormWithMapped(
    { fullName, company, title, email, phone, website },
    mappedFromApi,
  );

  const confirm = useMutation({
    mutationFn: () =>
      confirmOcrJob(api, jobId!, {
        fullName: formValues.fullName.trim(),
        company: formValues.company.trim() || undefined,
        title: formValues.title.trim() || undefined,
        emails: formValues.email.trim() ? [formValues.email.trim()] : [],
        phones: formValues.phone.trim() ? [formValues.phone.trim()] : [],
        leadQualifier: lead || undefined,
        encounterType: activeEncounterType,
        duplicateAction: linkId ? 'link' : 'new',
        linkToContactId: linkId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      Alert.alert('Saved', 'Contact created from scan.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/contacts') },
      ]);
    },
    onError: (e) => Alert.alert('Error', getApiErrorMessage(e)),
  });

  if (jobQuery.isLoading || !job) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={[styles.status, { color: colors.muted }]}>
          Processing scan…
        </Text>
      </View>
    );
  }

  if (job.status === 'failed') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.error}>OCR failed. Try scanning again.</Text>
        <Pressable
          style={[styles.centerBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.back()}
        >
          <Text style={styles.centerBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!isReviewReady(job.status)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={[styles.status, { color: colors.muted }]}>
          Status: {job.status}
        </Text>
      </View>
    );
  }

  const confidence =
    job.meanConfidence != null ? Math.round(job.meanConfidence * 100) : null;
  const firstMatch = job.matches?.[0];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Custom Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Review Scan
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Card Preview Container */}
        <View
          style={[
            styles.cardPreview,
            {
              backgroundColor: isDark ? '#1E293B' : '#E8EDF4',
              borderColor: colors.border,
            },
          ]}
        >
          {imageQuery.data?.url ? (
            <Image
              source={{ uri: imageQuery.data.url }}
              style={styles.cardImage}
              resizeMode="contain"
            />
          ) : imageQuery.isLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={36} color={colors.muted} />
              <Text style={[styles.cardPreviewText, { color: colors.muted }]}>
                Captured card
              </Text>
            </>
          )}
          {confidence != null && (
            <View style={styles.extractedBadge}>
              <Text style={styles.extractedBadgeText}>
                {confidence}% extracted
              </Text>
            </View>
          )}
        </View>

        {/* Duplicate warning banner */}
        {job.matches.length > 0 && showDuplicateBanner && firstMatch && (
          <View
            style={[
              styles.duplicateBanner,
              isDark && { backgroundColor: '#1E293B', borderColor: '#451A03' },
            ]}
          >
            <View style={styles.duplicateIconBg}>
              <Ionicons name="warning" size={20} color="#D97706" />
            </View>
            <View style={styles.duplicateContent}>
              <Text style={styles.duplicateTitle}>Possible duplicate</Text>
              <Text
                style={[styles.duplicateText, isDark && { color: '#F59E0B' }]}
              >
                Similar contact found:{' '}
                <Text style={{ fontWeight: '700', color: colors.text }}>
                  {firstMatch.matchedContactName}
                </Text>
                {firstMatch.matchedContactCompany
                  ? `, ${firstMatch.matchedContactCompany}`
                  : ''}
              </Text>
              <View style={styles.duplicateActions}>
                <Pressable
                  style={[
                    styles.dupBtn,
                    styles.mergeBtn,
                    linkId === firstMatch.matchedContactId &&
                      styles.mergeBtnActive,
                  ]}
                  onPress={() => setLinkId(firstMatch.matchedContactId)}
                >
                  <Text
                    style={[
                      styles.dupBtnText,
                      styles.mergeText,
                      linkId === firstMatch.matchedContactId &&
                        styles.mergeTextActive,
                    ]}
                  >
                    Merge
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.dupBtn,
                    styles.ignoreBtn,
                    isDark && {
                      backgroundColor: '#334155',
                      borderColor: '#475569',
                    },
                  ]}
                  onPress={() => setShowDuplicateBanner(false)}
                >
                  <Text
                    style={[
                      styles.dupBtnText,
                      styles.ignoreText,
                      isDark && { color: '#E2E8F0' },
                    ]}
                  >
                    Ignore
                  </Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              onPress={() => setShowDuplicateBanner(false)}
              style={styles.closeDuplicate}
            >
              <Ionicons name="close" size={16} color="#B45309" />
            </Pressable>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.muted }]}>FULL NAME</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Jordan Reeves"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.muted }]}>COMPANY</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={company}
            onChangeText={setCompany}
            placeholder="e.g. Vector Analytics"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.muted }]}>
            DESIGNATION
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Senior Account Executive"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.muted }]}>PHONE</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="e.g. +1 (646) 555-0123"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.muted }]}>EMAIL</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="e.g. jordan@vector.ai"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        {/* Lead selection */}
        <Text style={[styles.label, { color: colors.muted }]}>LEAD STATUS</Text>
        <View style={styles.leadRow}>
          {(['hot', 'warm', 'cold'] as LeadQualifier[]).map((l) => (
            <Pressable
              key={l}
              style={[
                styles.leadChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                lead === l && [
                  styles.leadChipActive,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                ],
              ]}
              onPress={() => setLead(l)}
            >
              <Text
                style={[
                  styles.leadChipText,
                  { color: colors.muted },
                  lead === l && styles.leadChipTextActive,
                ]}
              >
                {l}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 14,
          },
        ]}
      >
        <Pressable
          style={[styles.retakeBtn, { borderColor: colors.accent }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.retakeBtnText, { color: colors.accent }]}>
            Retake
          </Text>
        </Pressable>

        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          onPress={() => confirm.mutate()}
          disabled={!formValues.fullName.trim() || confirm.isPending}
        >
          {confirm.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Contact</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  root: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F4F6F8',
  },
  status: {
    marginTop: 12,
    color: COLORS.muted,
  },
  error: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 20,
  },
  centerBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  centerBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  cardPreview: {
    height: 180,
    backgroundColor: '#E8EDF4',
    borderWidth: 1,
    borderColor: '#D0DCEB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  cardPreviewText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 8,
  },
  extractedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#FDE68A',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  extractedBadgeText: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '700',
  },
  duplicateBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    position: 'relative',
  },
  duplicateIconBg: {
    marginRight: 12,
  },
  duplicateContent: {
    flex: 1,
    paddingRight: 16,
  },
  duplicateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  duplicateText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
    marginBottom: 12,
  },
  duplicateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dupBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dupBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mergeBtn: {
    backgroundColor: '#1E2D4A',
    borderColor: '#1E2D4A',
  },
  mergeBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  mergeText: {
    color: '#ffffff',
  },
  mergeTextActive: {
    color: '#ffffff',
  },
  ignoreBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#DDE3EA',
  },
  ignoreText: {
    color: '#334155',
  },
  closeDuplicate: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  leadRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  leadChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  leadChipActive: {
    backgroundColor: '#1E2D4A',
    borderColor: '#1E2D4A',
  },
  leadChipText: {
    textTransform: 'capitalize',
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  leadChipTextActive: {
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#1E2D4A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: {
    color: '#1E2D4A',
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.5,
    backgroundColor: '#1E2D4A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
