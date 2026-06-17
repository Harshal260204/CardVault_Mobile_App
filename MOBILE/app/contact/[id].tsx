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

import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import {
  deleteContact,
  fetchContact,
  getApiErrorMessage,
} from '@/lib/api-client';
import { formatCaptureMode, formatLeadLabel, leadColor } from '@/lib/format';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => fetchContact(api, id!),
    enabled: !!id,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteContact(api, id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      router.replace('/(tabs)/contacts');
    },
    onError: (error) =>
      Alert.alert('Unable to delete contact', getApiErrorMessage(error)),
  });

  if (isLoading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

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
        <Text style={[styles.name, { color: colors.text }]}>
          {data.fullName}
        </Text>
        {data.title ? (
          <Text style={[styles.meta, { color: colors.muted }]}>
            {data.title}
          </Text>
        ) : null}
        {data.company ? (
          <Text style={[styles.meta, { color: colors.muted }]}>
            {data.company}
          </Text>
        ) : null}
        <View
          style={[
            styles.badge,
            { backgroundColor: leadColor(data.leadQualifier) },
          ]}
        >
          <Text style={styles.badgeText}>
            {formatLeadLabel(data.leadQualifier)}
          </Text>
        </View>
        {data.captureMode ? (
          <Text style={[styles.modeText, { color: colors.muted }]}>
            {formatCaptureMode(data.captureMode)}
          </Text>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={[
            styles.secondaryButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() =>
            router.push({
              pathname: '/contact/edit/[id]',
              params: { id: data.id },
            })
          }
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Edit contact
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.relationshipButton,
            { borderColor: colors.accent, backgroundColor: colors.surface },
          ]}
          onPress={() => router.push(`/contact/${data.id}/relationships`)}
        >
          <Text
            style={[styles.relationshipButtonText, { color: colors.accent }]}
          >
            History
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.muted }]}>
        Contact details
      </Text>
      <View
        style={[
          styles.detailsCard,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        {data.emails.map((e: string) => (
          <Text key={e} style={[styles.line, { color: colors.text }]}>
            {e}
          </Text>
        ))}
        {data.phones.map((p: string) => (
          <Text key={p} style={[styles.line, { color: colors.text }]}>
            {p}
          </Text>
        ))}
        {data.website ? (
          <Text style={[styles.line, { color: colors.text }]}>
            {data.website}
          </Text>
        ) : null}
        {data.linkedinUrl ? (
          <Text style={[styles.line, { color: colors.text }]}>
            {data.linkedinUrl}
          </Text>
        ) : null}
        {data.followUpDate ? (
          <Text style={[styles.line, { color: colors.text }]}>
            Follow-up: {data.followUpDate}
          </Text>
        ) : null}
        {data.leadNote ? (
          <Text style={[styles.notes, { color: colors.text }]}>
            {data.leadNote}
          </Text>
        ) : null}
        {data.notes ? (
          <Text style={[styles.notes, { color: colors.text }]}>
            {data.notes}
          </Text>
        ) : null}
      </View>

      <Pressable
        style={styles.dangerButton}
        onPress={() =>
          Alert.alert(
            'Delete contact',
            'This contact will be removed from the mobile app.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteMutation.mutate(),
              },
            ],
          )
        }
      >
        <Ionicons name="trash-outline" size={16} color="#DC2626" />
        <Text style={styles.dangerButtonText}>
          {deleteMutation.isPending ? 'Deleting...' : 'Delete contact'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '800' },
  meta: { fontSize: 15, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 12,
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  modeText: { marginTop: 8, fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: { fontWeight: '600', textAlign: 'center' },
  relationshipButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  relationshipButtonText: { fontWeight: '600', textAlign: 'center' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  line: { fontSize: 16, marginBottom: 8 },
  notes: { fontSize: 15, marginTop: 8, lineHeight: 22 },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#fff5f5',
  },
  dangerButtonText: { color: '#DC2626', fontWeight: '600' },
});
