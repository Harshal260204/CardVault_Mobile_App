import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { ContactForm, type ContactFormValues } from '@/components/contact-form';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import {
  createContact,
  fetchSessions,
  getApiErrorMessage,
} from '@/lib/api-client';
import type { CaptureMode } from '@/lib/types';

export default function CreateContactScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    sessionId?: string;
    mode?: CaptureMode;
  }>();
  const sessionsQuery = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () =>
      fetchSessions(api, { limit: 100, mine: true, status: 'active' }),
  });

  type ContactPayload = Parameters<typeof createContact>[1];
  const createMutation = useMutation({
    mutationFn: (payload: ContactPayload) => createContact(api, payload),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      router.replace({ pathname: '/contact/[id]', params: { id: contact.id } });
    },
    onError: (error) =>
      Alert.alert('Unable to create contact', getApiErrorMessage(error)),
  });

  const initialValues: ContactFormValues = {
    fullName: '',
    company: '',
    title: '',
    emailsText: '',
    phonesText: '',
    website: '',
    linkedinUrl: '',
    leadNote: '',
    followUpDate: '',
    notes: '',
    captureMode: params.mode ?? 'legacy',
    eventSessionId: params.sessionId,
    leadQualifier: undefined,
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Create contact</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Add a contact manually and optionally attach it to an event.
      </Text>
      <ContactForm
        initialValues={initialValues}
        sessions={sessionsQuery.data?.items ?? []}
        isSubmitting={createMutation.isPending}
        submitLabel="Create contact"
        onSubmit={(payload) => {
          if (!payload.fullName.trim()) {
            Alert.alert(
              'Full name required',
              'Please enter a name before saving.',
            );
            return;
          }
          createMutation.mutate(payload);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, marginBottom: 20, lineHeight: 20, fontSize: 14 },
});
