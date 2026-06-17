import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import { fetchSessions, getApiErrorMessage } from '@/lib/api-client';
import { captureLog } from '@/lib/capture-logger';
import { COLORS } from '@/lib/constants';
import {
  OfflineQueuedError,
  submitOcrWithOfflineFallback,
} from '@/lib/sync/sync-service';
import { randomUuid } from '@/lib/uuid';
import { useSessionStore } from '@/stores/session-store';

interface CameraScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CameraScannerModal({
  visible,
  onClose,
}: CameraScannerModalProps) {
  const router = useRouter();
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const activeMode = useSessionStore((s) => s.activeMode);
  const activeEncounterType = useSessionStore((s) => s.activeEncounterType);
  const colors = useThemeColors();
  const [uploading, setUploading] = React.useState(false);

  const sessions = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () =>
      fetchSessions(api, { limit: 20, status: 'active', mine: true }),
    enabled: visible,
  });

  const availableSessions = sessions.data?.items ?? [];
  const selectedSession = availableSessions.find(
    (s) => s.id === activeSessionId,
  );

  const pickAndUpload = async (useCamera: boolean) => {
    if (!activeSessionId && activeMode !== 'quick_capture') {
      Alert.alert(
        'Active Event Required',
        'Please select or resume an active session from the Home screen first before scanning.',
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

    onClose(); // Close modal immediately upon selection to show loading or keep transition smooth

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
      // Find the correct mode
      const targetMode = selectedSession?.mode ?? activeMode;
      const job = await submitOcrWithOfflineFallback(
        {
          uri: asset.uri,
          name: asset.fileName ?? 'card.jpg',
          type: asset.mimeType ?? 'image/jpeg',
        },
        {
          captureMode: targetMode,
          sessionId: activeSessionId || undefined,
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

  const isScanAllowed = !!activeSessionId || activeMode === 'quick_capture';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.dragBar} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Scan Business Card
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.muted} />
            </Pressable>
          </View>

          {activeSessionId ? (
            <View style={styles.sessionBanner}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#0369A1"
              />
              <Text style={styles.sessionBannerText}>
                Scanning into event:{' '}
                <Text style={{ fontWeight: '600' }}>
                  {selectedSession?.name ?? 'Active Session'}
                </Text>
              </Text>
            </View>
          ) : activeMode === 'quick_capture' ? (
            <View
              style={[
                styles.sessionBanner,
                { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
              ]}
            >
              <Ionicons
                name="flash-outline"
                size={18}
                color="#16A34A"
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.sessionBannerText, { color: '#16A34A' }]}>
                Quick Capture Mode:{' '}
                <Text style={{ fontWeight: '600' }}>
                  Direct scan to contact list
                </Text>
              </Text>
            </View>
          ) : (
            <View style={styles.sessionWarningBanner}>
              <Ionicons name="warning-outline" size={18} color="#92400E" />
              <Text style={styles.sessionWarningText}>
                No active event. Please resume a session on the Home screen
                first.
              </Text>
            </View>
          )}

          <View style={styles.options}>
            <Pressable
              style={[
                styles.optButton,
                !isScanAllowed && styles.optButtonDisabled,
              ]}
              onPress={() => isScanAllowed && pickAndUpload(true)}
              disabled={!isScanAllowed || uploading}
            >
              <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="camera" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.optTitle}>Take Photo</Text>
              <Text style={styles.optSubtitle}>
                Use camera to scan business card
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.optButton,
                !isScanAllowed && styles.optButtonDisabled,
              ]}
              onPress={() => isScanAllowed && pickAndUpload(false)}
              disabled={!isScanAllowed || uploading}
            >
              <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="images" size={28} color="#059669" />
              </View>
              <Text style={styles.optTitle}>Choose from Gallery</Text>
              <Text style={styles.optSubtitle}>
                Select an existing image file
              </Text>
            </Pressable>
          </View>

          {uploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text style={styles.loadingText}>Uploading image...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    gap: 8,
  },
  sessionBannerText: {
    fontSize: 13,
    color: '#0369A1',
    flex: 1,
  },
  sessionWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    gap: 8,
  },
  sessionWarningText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },
  options: {
    flexDirection: 'row',
    gap: 16,
  },
  optButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  optButtonDisabled: {
    opacity: 0.5,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  optSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
});
