import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import { fetchSessions, getApiErrorMessage } from '@/lib/api-client';
import { formatCaptureMode } from '@/lib/format';
import type { EventSessionRecord } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';

export default function EventsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const sessions = useQuery({
    queryKey: ['sessions', 'mine', 'all'],
    queryFn: () => fetchSessions(api, { limit: 100, mine: true }),
  });

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>My events</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Events you created or joined, with contacts organized by category.
      </Text>

      <Pressable
        style={styles.createButton}
        onPress={() => router.push('/events/create')}
      >
        <Text style={styles.createButtonText}>Create event</Text>
      </Pressable>
      <Pressable
        style={[
          styles.browseButton,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
        onPress={() => router.push('/sessions/browse')}
      >
        <Text style={[styles.browseButtonText, { color: colors.text }]}>
          Browse organization sessions
        </Text>
      </Pressable>

      {sessions.isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : sessions.isError ? (
        <Text style={styles.errorText}>
          {getApiErrorMessage(sessions.error)}
        </Text>
      ) : sessions.data?.items.length ? (
        <View style={styles.list}>
          {sessions.data.items.map((session: EventSessionRecord) => (
            <View
              key={session.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/events/[id]',
                    params: { id: session.id },
                  })
                }
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {session.name}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.muted }]}>
                  {formatCaptureMode(session.mode)} · {session.status} ·{' '}
                  {session.scanCount} scans
                </Text>
                {session.location ? (
                  <Text style={[styles.cardHint, { color: colors.muted }]}>
                    {session.location}
                  </Text>
                ) : null}
              </Pressable>
              <Pressable
                style={[styles.scanButton, { borderColor: colors.accent }]}
                onPress={() => {
                  setActiveSession(session.id, session.mode);
                  router.push('/(tabs)/scan');
                }}
              >
                <Text style={[styles.scanButtonText, { color: colors.accent }]}>
                  Scan in this event
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No events yet. Create your first event or browse organization
            sessions.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, marginBottom: 16, lineHeight: 20, fontSize: 14 },
  createButton: {
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  browseButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  browseButtonText: { fontWeight: '600', textAlign: 'center' },
  list: { gap: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardMeta: { marginTop: 4 },
  cardHint: { marginTop: 6, fontSize: 13 },
  scanButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  scanButtonText: { fontWeight: '600', textAlign: 'center' },
  emptyCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorText: { color: '#DC2626', marginTop: 16 },
});
