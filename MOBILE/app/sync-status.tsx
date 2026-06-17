import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { formatCaptureMode, formatEncounterType } from '@/lib/format';
import { drainSyncQueue, refreshSyncState } from '@/lib/sync/sync-service';
import { useSyncStore } from '@/stores/sync-store';

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleString();
}

export default function SyncStatusScreen() {
  const colors = useThemeColors();
  const isOnline = useSyncStore((s) => s.isOnline);
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const pendingItems = useSyncStore((s) => s.pendingItems);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);

  useFocusEffect(
    useCallback(() => {
      void refreshSyncState();
    }, []),
  );

  const pendingCount = pendingItems.filter(
    (i) => i.status !== 'syncing',
  ).length;
  const syncing = syncStatus === 'syncing';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.statusCard,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        <View
          style={[
            styles.statusIconBg,
            { backgroundColor: isOnline ? '#ECFDF5' : '#FEF2F2' },
          ]}
        >
          <Ionicons
            name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={24}
            color={isOnline ? '#16A34A' : '#DC2626'}
          />
        </View>
        <View style={styles.statusContent}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Text style={[styles.statusDesc, { color: colors.muted }]}>
            Last synced {formatRelativeTime(lastSyncedAt)}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: pendingCount
                ? colors.isDark
                  ? '#422006'
                  : '#FEF3C7'
                : colors.isDark
                  ? '#064E3B'
                  : '#ECFDF5',
            },
          ]}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: pendingCount ? '#D97706' : '#16A34A',
            }}
          >
            {pendingCount ? `${pendingCount} pending` : 'Up to date'}
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
        onPress={() => void drainSyncQueue()}
        disabled={syncing || !isOnline}
      >
        {syncing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="sync-outline" size={18} color="#FFFFFF" />
            <Text style={styles.syncBtnText}>Sync now</Text>
          </>
        )}
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.muted }]}>
        Pending captures
      </Text>

      {pendingItems.length ? (
        pendingItems.map((item) => (
          <View
            key={item.id}
            style={[
              styles.queueCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.queueHeader}>
              <Text style={[styles.queueTitle, { color: colors.text }]}>
                {item.fileName}
              </Text>
              <View
                style={[
                  styles.queueBadge,
                  item.status === 'failed'
                    ? { backgroundColor: '#FEE2E2' }
                    : item.status === 'syncing'
                      ? { backgroundColor: '#DBEAFE' }
                      : {
                          backgroundColor: colors.isDark
                            ? '#334155'
                            : '#F1F5F9',
                        },
                ]}
              >
                <Text style={styles.queueBadgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={[styles.queueMeta, { color: colors.muted }]}>
              {formatCaptureMode(item.captureMode)}
              {item.encounterType
                ? ` · ${formatEncounterType(item.encounterType)}`
                : ''}
            </Text>
            <Text style={[styles.queueMeta, { color: colors.muted }]}>
              Queued {formatRelativeTime(item.createdAt)}
            </Text>
            {item.errorMessage ? (
              <Text style={styles.queueError}>{item.errorMessage}</Text>
            ) : null}
          </View>
        ))
      ) : (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={28} color="#16A34A" />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No pending captures. Scans made offline will appear here until they
            sync.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  statusIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  statusDesc: { fontSize: 13 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  syncBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  syncBtnDisabled: { opacity: 0.7 },
  syncBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  queueCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  queueTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  queueBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  queueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#475569',
  },
  queueMeta: { fontSize: 12, marginBottom: 2 },
  queueError: { fontSize: 12, color: '#DC2626', marginTop: 6 },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
