import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import {
  fetchContact,
  fetchContactEncounters,
  fetchContacts,
  getApiErrorMessage,
} from '@/lib/api-client';
import {
  formatCaptureMode,
  formatEncounterType,
  formatLeadLabel,
  leadColor,
} from '@/lib/format';
import type { EncounterType } from '@/lib/types';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ContactRelationshipsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const contactQuery = useQuery({
    queryKey: ['contact', id],
    queryFn: () => fetchContact(api, id!),
    enabled: !!id,
  });

  const encountersQuery = useQuery({
    queryKey: ['contact-encounters', id],
    queryFn: () => fetchContactEncounters(api, id!),
    enabled: !!id,
  });

  const relatedQuery = useQuery({
    queryKey: [
      'contact-related',
      id,
      contactQuery.data?.emails?.[0],
      contactQuery.data?.company,
    ],
    queryFn: async () => {
      const contact = contactQuery.data!;
      const queries = [
        contact.emails[0],
        contact.company && contact.fullName
          ? `${contact.fullName} ${contact.company}`
          : null,
      ].filter(Boolean) as string[];

      const results = await Promise.all(
        queries.map((q) => fetchContacts(api, { q, limit: 20 })),
      );
      const seen = new Set<string>();
      const related = [];
      for (const result of results) {
        for (const item of result.items) {
          if (item.id === contact.id || seen.has(item.id)) continue;
          seen.add(item.id);
          related.push(item);
        }
      }
      return related;
    },
    enabled: !!contactQuery.data,
  });

  if (contactQuery.isLoading || !contactQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const contact = contactQuery.data;
  const encounters = encountersQuery.data ?? [];
  const related = relatedQuery.data ?? [];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.heroName, { color: colors.text }]}>
          {contact.fullName}
        </Text>
        <Text style={[styles.heroMeta, { color: colors.muted }]}>
          {[contact.title, contact.company].filter(Boolean).join(' · ') ||
            'No company'}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.muted }]}>
        Encounter history
      </Text>
      {encountersQuery.isLoading ? (
        <ActivityIndicator
          color={colors.accent}
          style={{ marginVertical: 16 }}
        />
      ) : encountersQuery.isError ? (
        <Text style={styles.errorText}>
          {getApiErrorMessage(encountersQuery.error)}
        </Text>
      ) : encounters.length ? (
        encounters.map((encounter) => (
          <View
            key={encounter.id}
            style={[
              styles.timelineCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.timelineHeader}>
              <Ionicons name="time-outline" size={16} color={colors.muted} />
              <Text style={[styles.timelineWhen, { color: colors.muted }]}>
                {formatWhen(encounter.createdAt)}
              </Text>
            </View>
            <Text style={[styles.timelineTitle, { color: colors.text }]}>
              {encounter.encounterLabel ||
                (encounter.encounterType
                  ? formatEncounterType(
                      encounter.encounterType as EncounterType,
                    )
                  : 'Capture')}
            </Text>
            <Text style={[styles.timelineMeta, { color: colors.muted }]}>
              {formatCaptureMode(encounter.captureMode)}
              {encounter.leadQualifier
                ? ` · ${formatLeadLabel(encounter.leadQualifier)}`
                : ''}
            </Text>
            {encounter.leadNote ? (
              <Text style={[styles.timelineNote, { color: colors.text }]}>
                {encounter.leadNote}
              </Text>
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
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No encounter history yet.
          </Text>
        </View>
      )}

      <Text
        style={[styles.sectionTitle, { color: colors.muted, marginTop: 8 }]}
      >
        Possible matches
      </Text>
      {relatedQuery.isLoading ? (
        <ActivityIndicator
          color={colors.accent}
          style={{ marginVertical: 16 }}
        />
      ) : related.length ? (
        related.map((match) => (
          <Pressable
            key={match.id}
            style={[
              styles.matchCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/contact/[id]',
                params: { id: match.id },
              })
            }
          >
            <View style={styles.matchHeader}>
              <Text style={[styles.matchName, { color: colors.text }]}>
                {match.fullName}
              </Text>
              <View
                style={[
                  styles.leadBadge,
                  { backgroundColor: leadColor(match.leadQualifier) },
                ]}
              >
                <Text style={styles.leadBadgeText}>
                  {formatLeadLabel(match.leadQualifier)}
                </Text>
              </View>
            </View>
            <Text style={[styles.matchMeta, { color: colors.muted }]}>
              {match.company || 'No company'} ·{' '}
              {formatCaptureMode(match.captureMode)}
            </Text>
            <View style={styles.matchFooter}>
              <Text style={[styles.viewLink, { color: colors.accent }]}>
                View contact
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.accent}
              />
            </View>
          </Pressable>
        ))
      ) : (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No related contacts found by email or company.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 },
  heroName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  heroMeta: { fontSize: 13 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timelineCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timelineWhen: { fontSize: 12 },
  timelineTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  timelineMeta: { fontSize: 12 },
  timelineNote: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  matchCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  matchName: { fontSize: 15, fontWeight: '700', flex: 1 },
  leadBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  leadBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  matchMeta: { fontSize: 12, marginTop: 6, marginBottom: 10 },
  matchFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewLink: { fontSize: 13, fontWeight: '600' },
  emptyCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  errorText: { color: '#DC2626', marginBottom: 12 },
});
