import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import {
  fetchSessions,
  getApiErrorMessage,
  joinSession,
} from '@/lib/api-client';
import { formatCaptureMode } from '@/lib/format';
import type { EventSessionRecord } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';

export default function BrowseSessionsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const [q, setQ] = useState('');

  const sessions = useQuery({
    queryKey: ['sessions', 'org', 'active', q],
    queryFn: () => fetchSessions(api, { limit: 100, status: 'active' }),
  });

  const joinMutation = useMutation({
    mutationFn: (sessionId: string) => joinSession(api, sessionId),
    onSuccess: async (_, sessionId) => {
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      const session = sessions.data?.items.find((s) => s.id === sessionId);
      if (session) {
        setActiveSession(session.id, session.mode);
        router.push({ pathname: '/events/[id]', params: { id: session.id } });
      }
    },
    onError: (error) =>
      Alert.alert('Could not join session', getApiErrorMessage(error)),
  });

  const filtered =
    sessions.data?.items.filter((session) => {
      if (!q.trim()) return true;
      const needle = q.trim().toLowerCase();
      return (
        session.name.toLowerCase().includes(needle) ||
        (session.location ?? '').toLowerCase().includes(needle) ||
        formatCaptureMode(session.mode).toLowerCase().includes(needle)
      );
    }) ?? [];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Browse sessions
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Join active events across your organization and start scanning.
      </Text>

      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name, location, or mode"
          placeholderTextColor={colors.placeholder}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {sessions.isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : sessions.isError ? (
        <Text style={styles.errorText}>
          {getApiErrorMessage(sessions.error)}
        </Text>
      ) : filtered.length ? (
        filtered.map((session: EventSessionRecord) => (
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
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.modePill,
                  { backgroundColor: colors.isDark ? '#334155' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.modePillText, { color: colors.muted }]}>
                  {formatCaptureMode(session.mode).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.scanCount, { color: colors.muted }]}>
                {session.scanCount} scans
              </Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {session.name}
            </Text>
            {session.location ? (
              <Text style={[styles.cardMeta, { color: colors.muted }]}>
                {session.location}
              </Text>
            ) : null}
            <View style={styles.cardActions}>
              <Pressable
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={() =>
                  router.push({
                    pathname: '/events/[id]',
                    params: { id: session.id },
                  })
                }
              >
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                  View
                </Text>
              </Pressable>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => joinMutation.mutate(session.id)}
                disabled={joinMutation.isPending}
              >
                <Text style={styles.primaryBtnText}>
                  {joinMutation.isPending ? 'Joining…' : 'Join & scan'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No active organization sessions match your search.
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modePill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  modePillText: { fontSize: 10, fontWeight: '700' },
  scanCount: { fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardMeta: { fontSize: 13, marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '600', fontSize: 14 },
  primaryBtn: {
    flex: 1.4,
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorText: { color: '#DC2626', textAlign: 'center', marginTop: 24 },
});
