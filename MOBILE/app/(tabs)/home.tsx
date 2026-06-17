import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import CameraScannerModal from '@/components/CameraScannerModal';
import SessionMemberAvatars from '@/components/SessionMemberAvatars';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import {
  fetchContacts,
  fetchSessions,
  getApiErrorMessage,
} from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import type { EventSessionRecord } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import { useSessionStore } from '@/stores/session-store';
import { useSyncStore } from '@/stores/sync-store';

export default function HomeScreen() {
  const router = useRouter();
  const { openScanner } = useLocalSearchParams<{ openScanner?: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.isDark;
  const user = useAuthStore((s) => s.user);
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: !!user,
  });

  const profile = me.data ?? user;
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const pendingCount = useSyncStore(
    (s) => s.pendingItems.filter((i) => i.status !== 'syncing').length,
  );

  const [scannerVisible, setScannerVisible] = useState(false);

  React.useEffect(() => {
    if (openScanner === '1') {
      setScannerVisible(true);
      router.replace('/(tabs)/home');
    }
  }, [openScanner, router]);

  // Queries
  const contacts = useQuery({
    queryKey: ['contacts', 'recent'],
    queryFn: () => fetchContacts(api, { limit: 100 }),
  });
  const sessions = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () =>
      fetchSessions(api, { limit: 10, status: 'active', mine: true }),
  });

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const totalScans = profile?.cardsScanned ?? contacts.data?.meta?.total ?? 0;
  const returningScans =
    contacts.data?.items.filter(
      (c) => (c.emails?.length ?? 0) > 1 || c.isMerged,
    ).length ?? 0;
  const lastSyncedAt = contacts.dataUpdatedAt
    ? new Date(contacts.dataUpdatedAt).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const activeSessions = sessions.data?.items ?? [];
  const liveCount = activeSessions.length;

  const handleResumeSession = (session: EventSessionRecord) => {
    setActiveSession(session.id, session.mode);
    setScannerVisible(true);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.orgName, { color: colors.muted }]}>
              {profile?.organizationName ?? 'Your organization'}
            </Text>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {getGreeting()}, {profile?.fullName?.split(' ')[0] ?? 'there'}
            </Text>
            <View style={styles.statusRow}>
              <Ionicons
                name={contacts.isError ? 'cloud-offline-outline' : 'wifi'}
                size={14}
                color={contacts.isError ? '#EF4444' : '#22C55E'}
              />
              <Text style={styles.statusText}>
                {contacts.isError
                  ? 'Offline'
                  : lastSyncedAt
                    ? `Synced ${lastSyncedAt}`
                    : 'Synced'}
                <Text style={[styles.statusMuted, { color: colors.muted }]}>
                  {' '}
                  · {totalScans} scans · {returningScans} returning
                </Text>
              </Text>
            </View>
            {pendingCount > 0 ? (
              <Pressable
                style={styles.syncPill}
                onPress={() => router.push('/sync-status')}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={12}
                  color="#D97706"
                />
                <Text style={styles.syncPillText}>
                  {pendingCount} pending sync
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            style={[
              styles.searchBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push('/(tabs)/contacts')}
          >
            <Ionicons name="search" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Capture Mode List */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          Capture Mode
        </Text>

        <Pressable
          style={[
            styles.modeListItem,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() =>
            router.push({
              pathname: '/events/create',
              params: { initialMode: 'visitor' },
            })
          }
        >
          <View
            style={[
              styles.modeIconBg,
              { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
            ]}
          >
            <Ionicons
              name="business-outline"
              size={20}
              color={isDark ? '#94A3B8' : '#475569'}
            />
          </View>
          <View style={styles.modeItemContent}>
            <View style={styles.modeItemHeader}>
              <Text style={[styles.modeItemName, { color: colors.text }]}>
                Visitor Mode
              </Text>
              <View
                style={[
                  styles.modeItemBadge,
                  isDark && { backgroundColor: '#334155' },
                ]}
              >
                <Text
                  style={[styles.modeItemBadgeText, { color: colors.muted }]}
                >
                  Event-linked
                </Text>
              </View>
            </View>
            <Text style={[styles.modeItemDesc, { color: colors.muted }]}>
              Structured capture tied to an event agenda and booths.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        <Pressable
          style={[
            styles.modeListItem,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() =>
            router.push({
              pathname: '/events/create',
              params: { initialMode: 'exhibitor' },
            })
          }
        >
          <View
            style={[
              styles.modeIconBg,
              { backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF' },
            ]}
          >
            <Ionicons
              name="briefcase-outline"
              size={20}
              color={isDark ? '#60A5FA' : '#2563EB'}
            />
          </View>
          <View style={styles.modeItemContent}>
            <View style={styles.modeItemHeader}>
              <Text style={[styles.modeItemName, { color: colors.text }]}>
                Exhibitor Mode
              </Text>
              <View
                style={[
                  styles.modeItemBadge,
                  { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' },
                ]}
              >
                <Text
                  style={[
                    styles.modeItemBadgeText,
                    { color: isDark ? '#34D399' : '#047857' },
                  ]}
                >
                  Live stats
                </Text>
              </View>
            </View>
            <Text style={[styles.modeItemDesc, { color: colors.muted }]}>
              Fast capture with lead qualification and team live view.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        <Pressable
          style={[
            styles.modeListItem,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push('/encounter-select')}
        >
          <View
            style={[
              styles.modeIconBg,
              { backgroundColor: isDark ? '#065F46' : '#F0FDF4' },
            ]}
          >
            <Ionicons
              name="flash-outline"
              size={20}
              color={isDark ? '#34D399' : '#16A34A'}
            />
          </View>
          <View style={styles.modeItemContent}>
            <View style={styles.modeItemHeader}>
              <Text style={[styles.modeItemName, { color: colors.text }]}>
                Quick Capture
              </Text>
              <View
                style={[
                  styles.modeItemBadge,
                  isDark && { backgroundColor: '#334155' },
                ]}
              >
                <Text
                  style={[styles.modeItemBadgeText, { color: colors.muted }]}
                >
                  No event link
                </Text>
              </View>
            </View>
            <Text style={[styles.modeItemDesc, { color: colors.muted }]}>
              Direct scan to your contact list.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        {/* Active Sessions */}
        <View style={styles.sectionHeaderAlt}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            Active Sessions
          </Text>
          <Text style={[styles.sectionBadge, { color: colors.muted }]}>
            {liveCount} live
          </Text>
        </View>

        {sessions.isLoading ? (
          <ActivityIndicator
            color={COLORS.accent}
            style={{ marginVertical: 24 }}
          />
        ) : sessions.isError ? (
          <Text style={styles.errorText}>
            {getApiErrorMessage(sessions.error)}
          </Text>
        ) : activeSessions.length ? (
          activeSessions.map((s: EventSessionRecord) => {
            const targetScans = s.mode === 'exhibitor' ? 200 : 60;
            const progress = Math.min(s.scanCount / targetScans, 1);

            return (
              <View
                key={s.id}
                style={[
                  styles.sessionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Mode and Avatars */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.modePill,
                      s.mode === 'exhibitor'
                        ? isDark
                          ? { backgroundColor: '#1E3A8A' }
                          : styles.modeExhibitor
                        : isDark
                          ? { backgroundColor: '#334155' }
                          : styles.modeVisitor,
                    ]}
                  >
                    <Ionicons
                      name={s.mode === 'exhibitor' ? 'briefcase' : 'people'}
                      size={12}
                      color={
                        s.mode === 'exhibitor'
                          ? isDark
                            ? '#60A5FA'
                            : '#0284C7'
                          : isDark
                            ? '#94A3B8'
                            : '#64748B'
                      }
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.modeText,
                        s.mode === 'exhibitor'
                          ? isDark
                            ? { color: '#60A5FA' }
                            : styles.modeTextExhibitor
                          : isDark
                            ? { color: '#94A3B8' }
                            : styles.modeTextVisitor,
                      ]}
                    >
                      {s.mode.toUpperCase()}
                    </Text>
                    {s.mode === 'exhibitor' && (
                      <Text style={styles.liveDot}> • LIVE</Text>
                    )}
                  </View>

                  <SessionMemberAvatars sessionId={s.id} />
                </View>

                {/* Session Title */}
                <Text style={[styles.sessionName, { color: colors.text }]}>
                  {s.name}
                </Text>

                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <Text style={[styles.progressText, { color: colors.muted }]}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>
                      {s.scanCount}
                    </Text>{' '}
                    / {targetScans} scans
                  </Text>
                  <Text style={[styles.timeText, { color: colors.muted }]}>
                    {s.status === 'active' ? 'active now' : s.status}
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBarBg,
                    { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: isDark ? '#3B82F6' : '#1E293B',
                      },
                    ]}
                  />
                </View>

                {/* Lead Breakdown Counts */}
                <View style={styles.statsRow}>
                  <View
                    style={[
                      styles.statPill,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[styles.statDot, { backgroundColor: '#EF4444' }]}
                    />
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      HOT
                    </Text>
                    <Text style={[styles.statCount, { color: colors.text }]}>
                      {s.hotCount}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statPill,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[styles.statDot, { backgroundColor: '#F59E0B' }]}
                    />
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      WARM
                    </Text>
                    <Text style={[styles.statCount, { color: colors.text }]}>
                      {s.warmCount}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statPill,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[styles.statDot, { backgroundColor: '#3B82F6' }]}
                    />
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      COLD
                    </Text>
                    <Text style={[styles.statCount, { color: colors.text }]}>
                      {s.coldCount}
                    </Text>
                  </View>
                </View>

                {/* Resume button */}
                <Pressable
                  style={styles.resumeBtn}
                  onPress={() => handleResumeSession(s)}
                >
                  <Text style={styles.resumeText}>Resume Session</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No active events yet. Create one or browse organization sessions.
            </Text>
            <Pressable
              style={styles.browseBtn}
              onPress={() => router.push('/sessions/browse')}
            >
              <Text style={styles.browseBtnText}>Browse sessions</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <Pressable
        style={[
          styles.fab,
          { bottom: 56 + (insets.bottom > 0 ? insets.bottom : 8) + 16 },
        ]}
        onPress={() => setScannerVisible(true)}
      >
        <Ionicons name="camera" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Camera Scan Modal */}
      <CameraScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  root: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 24,
  },
  orgName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  statusMuted: {
    color: '#64748B',
    fontWeight: '400',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionBadge: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F0F8',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeVisitor: {
    backgroundColor: '#F1F5F9',
  },
  modeExhibitor: {
    backgroundColor: '#EFF6FF',
  },
  modeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTextVisitor: {
    color: '#475569',
  },
  modeTextExhibitor: {
    color: '#1D4ED8',
  },
  liveDot: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22C55E',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarInitials: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    color: '#64748B',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    flex: 1,
    marginLeft: 6,
  },
  statCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  resumeBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  resumeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  browseBtn: {
    backgroundColor: '#1E2D4A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  browseBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  syncPillText: { fontSize: 11, fontWeight: '600', color: '#D97706' },
  modeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F0F8',
    marginBottom: 10,
  },
  modeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modeItemContent: {
    flex: 1,
  },
  modeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  modeItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modeItemBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeItemBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  modeItemDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E2D4A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginVertical: 12,
  },
});
