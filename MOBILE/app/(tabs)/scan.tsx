import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import { fetchSessions, getApiErrorMessage } from '@/lib/api-client';
import { captureLog } from '@/lib/capture-logger';
import { formatCaptureMode } from '@/lib/format';
import {
  OfflineQueuedError,
  submitOcrWithOfflineFallback,
} from '@/lib/sync/sync-service';
import type { EventSessionRecord } from '@/lib/types';
import { randomUuid } from '@/lib/uuid';
import { useSessionStore } from '@/stores/session-store';

export default function ScanScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const activeMode = useSessionStore((s) => s.activeMode);
  const activeEncounterType = useSessionStore((s) => s.activeEncounterType);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const [sessionId, setSessionId] = useState<string | undefined>(
    activeSessionId,
  );
  const [uploading, setUploading] = useState(false);

  const sessions = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () =>
      fetchSessions(api, { limit: 50, status: 'active', mine: true }),
  });

  useEffect(() => {
    if (activeSessionId) setSessionId(activeSessionId);
  }, [activeSessionId]);

  const availableSessions = useMemo(
    () => sessions.data?.items ?? [],
    [sessions.data?.items],
  );
  const selectedSession = useMemo(
    () => availableSessions.find((session) => session.id === sessionId),
    [availableSessions, sessionId],
  );

  const isQuickCapture = activeMode === 'quick_capture' && !selectedSession;
  const isScanAllowed = !!selectedSession || isQuickCapture;

  const pickAndUpload = async (useCamera: boolean) => {
    if (!isScanAllowed) {
      Alert.alert(
        'Select capture mode',
        'Choose an active event, or start Quick Capture from Home.',
      );
      return;
    }

    const source = useCamera ? 'camera' : 'gallery';
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      captureLog.permissionDenied(source);
      Alert.alert(
        'Permission needed',
        'Allow camera or photo access to scan cards.',
      );
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) {
      captureLog.pickCancelled(source);
      return;
    }

    const asset = result.assets[0];
    captureLog.pickSelected(source, asset);
    const idempotencyKey = randomUuid();
    setUploading(true);
    try {
      const targetMode = selectedSession?.mode ?? activeMode;
      const job = await submitOcrWithOfflineFallback(
        {
          uri: asset.uri,
          name: asset.fileName ?? 'card.jpg',
          type: asset.mimeType ?? 'image/jpeg',
        },
        {
          captureMode: targetMode,
          sessionId: selectedSession?.id,
          clientIdempotencyKey: idempotencyKey,
          encounterType: activeEncounterType,
        },
      );
      router.push({ pathname: '/ocr-review', params: { jobId: job.id } });
    } catch (e) {
      if (e instanceof OfflineQueuedError) {
        Alert.alert('Saved offline', e.message, [
          { text: 'View queue', onPress: () => router.push('/sync-status') },
          { text: 'OK' },
        ]);
        return;
      }
      Alert.alert('Upload failed', getApiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Scan business card
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Scan into an active event, or use Quick Capture for standalone contacts.
      </Text>

      {isQuickCapture ? (
        <View
          style={[
            styles.quickBanner,
            {
              backgroundColor: colors.isDark ? '#064E3B' : '#F0FDF4',
              borderColor: colors.isDark ? '#065F46' : '#BBF7D0',
            },
          ]}
        >
          <Ionicons name="flash-outline" size={18} color="#16A34A" />
          <Text
            style={[
              styles.quickBannerText,
              { color: colors.isDark ? '#34D399' : '#15803D' },
            ]}
          >
            {activeEncounterType
              ? `Encounter: ${activeEncounterType}`
              : 'No event linked — saves directly to your contact list.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryAction}
          onPress={() => router.push('/events/create')}
        >
          <Text style={styles.primaryActionText}>Create event</Text>
        </Pressable>
        <Pressable
          style={[
            styles.secondaryAction,
            { borderColor: colors.accent, backgroundColor: colors.surface },
          ]}
          onPress={() => router.push('/encounter-select')}
        >
          <Text style={[styles.secondaryActionText, { color: colors.accent }]}>
            Quick capture
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.secondaryAction,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={() => router.push('/sessions/browse')}
        >
          <Text style={[styles.secondaryActionText, { color: colors.text }]}>
            Browse org sessions
          </Text>
        </Pressable>
      </View>

      {!isQuickCapture ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>
            Choose an active event
          </Text>
          {sessions.isLoading ? (
            <ActivityIndicator
              color={colors.accent}
              style={{ marginVertical: 20 }}
            />
          ) : sessions.isError ? (
            <Text style={styles.errorText}>
              {getApiErrorMessage(sessions.error)}
            </Text>
          ) : availableSessions.length ? (
            <View style={styles.sessionList}>
              {availableSessions.map((s: EventSessionRecord) => {
                const selected = sessionId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    style={[
                      styles.sessionCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: selected
                          ? colors.accent
                          : colors.cardBorder,
                      },
                      selected && {
                        backgroundColor: colors.isDark ? '#1E3A5F' : '#EFF6FF',
                      },
                    ]}
                    onPress={() => {
                      setSessionId(s.id);
                      setActiveSession(s.id, s.mode);
                    }}
                  >
                    <Text
                      style={[
                        styles.sessionTitle,
                        { color: selected ? colors.accent : colors.text },
                      ]}
                    >
                      {s.name}
                    </Text>
                    <Text style={[styles.sessionMeta, { color: colors.muted }]}>
                      {formatCaptureMode(s.mode)} · {s.scanCount} scans
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              You don&apos;t have any active events yet.
            </Text>
          )}
        </>
      ) : null}

      {uploading ? (
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={{ marginTop: 32 }}
        />
      ) : (
        <>
          <Pressable
            style={[styles.primary, !isScanAllowed && styles.disabled]}
            onPress={() => pickAndUpload(true)}
            disabled={!isScanAllowed}
          >
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Take photo</Text>
          </Pressable>
          <Pressable
            style={[
              styles.secondary,
              { borderColor: colors.accent, backgroundColor: colors.surface },
              !isScanAllowed && styles.disabled,
            ]}
            onPress={() => pickAndUpload(false)}
            disabled={!isScanAllowed}
          >
            <Text style={[styles.secondaryText, { color: colors.accent }]}>
              Choose from gallery
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, marginBottom: 16, lineHeight: 20, fontSize: 14 },
  quickBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  quickBannerText: { flex: 1, fontSize: 13 },
  actions: { gap: 10, marginBottom: 20 },
  primaryAction: { backgroundColor: '#1E2D4A', borderRadius: 12, padding: 14 },
  primaryActionText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  secondaryAction: { borderWidth: 1, borderRadius: 12, padding: 14 },
  secondaryActionText: { fontWeight: '600', textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  sessionList: { gap: 10, marginBottom: 20 },
  sessionCard: { borderRadius: 16, padding: 14, borderWidth: 1 },
  sessionTitle: { fontSize: 16, fontWeight: '600' },
  sessionMeta: { marginTop: 4, fontSize: 13 },
  primary: {
    flexDirection: 'row',
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  secondary: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryText: { fontWeight: '600', textAlign: 'center', fontSize: 16 },
  disabled: { opacity: 0.5 },
  emptyText: { marginBottom: 20 },
  errorText: { color: '#DC2626', marginBottom: 20 },
});
