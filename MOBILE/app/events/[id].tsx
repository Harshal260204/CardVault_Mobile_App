import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import SessionMemberAvatars from '@/components/SessionMemberAvatars';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import {
  fetchContacts,
  fetchSession,
  fetchSessionMembers,
  fetchSessionStats,
  getApiErrorMessage,
  joinSession,
} from '@/lib/api-client';
import { formatCaptureMode, formatLeadLabel, leadColor } from '@/lib/format';
import type { CaptureMode, ContactRecord } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';

const GROUP_ORDER: CaptureMode[] = ['visitor', 'exhibitor', 'quick_capture'];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const qc = useQueryClient();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const sessionQuery = useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchSession(api, id!),
    enabled: !!id,
  });
  const statsQuery = useQuery({
    queryKey: ['session-stats', id],
    queryFn: () => fetchSessionStats(api, id!),
    enabled: !!id,
    refetchInterval: 15000,
  });
  const membersQuery = useQuery({
    queryKey: ['session-members', id],
    queryFn: () => fetchSessionMembers(api, id!),
    enabled: !!id,
  });
  const contactsQuery = useQuery({
    queryKey: ['contacts', 'session', id],
    queryFn: () => fetchContacts(api, { sessionId: id!, limit: 100 }),
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinSession(api, id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-members', id] });
      Alert.alert('Joined', 'You joined this event session.');
    },
    onError: (e) => Alert.alert('Could not join', getApiErrorMessage(e)),
  });

  if (sessionQuery.isLoading || contactsQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (sessionQuery.isError || contactsQuery.isError || !sessionQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>
          {sessionQuery.isError
            ? getApiErrorMessage(sessionQuery.error)
            : contactsQuery.isError
              ? getApiErrorMessage(contactsQuery.error)
              : 'Unable to load event.'}
        </Text>
      </View>
    );
  }

  const contacts = contactsQuery.data?.items ?? [];
  const grouped = GROUP_ORDER.map((mode) => ({
    mode,
    items: contacts.filter((contact) => contact.captureMode === mode),
  }));
  const session = sessionQuery.data;
  const stats = statsQuery.data ?? session;
  const members = membersQuery.data ?? [];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>{session.name}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {formatCaptureMode(session.mode)} · {session.status}
        {session.location ? ` · ${session.location}` : ''}
      </Text>

      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.summaryLabel, { color: colors.muted }]}>
          Live session stats
        </Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {stats.scanCount} scans
        </Text>
        <Text style={[styles.summaryMeta, { color: colors.muted }]}>
          Hot {stats.hotCount} · Warm {stats.warmCount} · Cold {stats.coldCount}
        </Text>
      </View>

      <View
        style={[
          styles.teamCard,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.teamHeader}>
          <Text style={[styles.teamTitle, { color: colors.text }]}>
            Team ({members.length})
          </Text>
          <SessionMemberAvatars sessionId={session.id} />
        </View>
        {members.map((member) => (
          <Text
            key={member.userId}
            style={[styles.teamMember, { color: colors.muted }]}
          >
            {member.fullName ?? member.email}
          </Text>
        ))}
        <Pressable
          style={[styles.joinBtn, { borderColor: colors.accent }]}
          onPress={() => joinMutation.mutate()}
          disabled={joinMutation.isPending}
        >
          <Text style={[styles.joinBtnText, { color: colors.accent }]}>
            {joinMutation.isPending ? 'Joining…' : 'Join session'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={[
            styles.secondary,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() =>
            router.push({
              pathname: '/events/edit/[id]',
              params: { id: session.id },
            })
          }
        >
          <Text style={[styles.secondaryText, { color: colors.text }]}>
            Edit event
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.secondary,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() =>
            router.push({
              pathname: '/contact/create',
              params: { sessionId: session.id, mode: session.mode },
            })
          }
        >
          <Text style={[styles.secondaryText, { color: colors.text }]}>
            Add contact
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.primary}
        onPress={() => {
          setActiveSession(session.id, session.mode);
          router.push('/(tabs)/scan');
        }}
      >
        <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
        <Text style={styles.primaryText}>Scan in this event</Text>
      </Pressable>

      {grouped.map((group) => (
        <View key={group.mode} style={styles.groupSection}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>
            {formatCaptureMode(group.mode)} ({group.items.length})
          </Text>
          {group.items.length ? (
            group.items.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No contacts in this category yet.
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function ContactCard({ contact }: { contact: ContactRecord }) {
  const router = useRouter();
  const colors = useThemeColors();
  return (
    <Pressable
      style={[
        styles.contactCard,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      ]}
      onPress={() =>
        router.push({ pathname: '/contact/[id]', params: { id: contact.id } })
      }
    >
      <View style={styles.contactHeader}>
        <Text style={[styles.contactName, { color: colors.text }]}>
          {contact.fullName}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: leadColor(contact.leadQualifier) },
          ]}
        >
          <Text style={styles.badgeText}>
            {formatLeadLabel(contact.leadQualifier)}
          </Text>
        </View>
      </View>
      <Text style={[styles.contactMeta, { color: colors.muted }]}>
        {contact.company || 'No company'} ·{' '}
        {formatCaptureMode(contact.captureMode)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, marginBottom: 16, lineHeight: 20, fontSize: 14 },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: '700' },
  summaryMeta: { marginTop: 6, fontSize: 13 },
  teamCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamTitle: { fontSize: 14, fontWeight: '700' },
  teamMember: { fontSize: 13, marginBottom: 4 },
  joinBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinBtnText: { fontWeight: '600' },
  primary: {
    flexDirection: 'row',
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  secondary: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14 },
  secondaryText: { fontWeight: '600', textAlign: 'center' },
  groupSection: { marginBottom: 20 },
  groupTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  emptyText: {},
  contactCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  contactName: { flex: 1, fontSize: 16, fontWeight: '600' },
  contactMeta: { marginTop: 6 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  errorText: { color: '#DC2626', textAlign: 'center' },
});
