import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContactForm, type ContactFormValues } from '@/components/contact-form';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import {
  fetchContact,
  fetchSessions,
  getApiErrorMessage,
  updateContact,
} from '@/lib/api-client';
import type { CaptureMode } from '@/lib/types';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const contactQuery = useQuery({
    queryKey: ['contact', id],
    queryFn: () => fetchContact(api, id!),
    enabled: !!id,
  });
  const sessionsQuery = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () =>
      fetchSessions(api, { limit: 100, mine: true, status: 'active' }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateContact>[2]) =>
      updateContact(api, id!, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contacts'] }),
        queryClient.invalidateQueries({ queryKey: ['contact', id] }),
      ]);
      router.replace({ pathname: '/contact/[id]', params: { id: id! } });
    },
    onError: (error) =>
      Alert.alert('Unable to update contact', getApiErrorMessage(error)),
  });

  if (contactQuery.isLoading || !contactQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          {contactQuery.isLoading
            ? 'Loading contact...'
            : 'Unable to load contact.'}
        </Text>
      </View>
    );
  }

  const contact = contactQuery.data;
  const initialValues: ContactFormValues = {
    fullName: contact.fullName,
    company: contact.company ?? '',
    title: contact.title ?? '',
    emailsText: contact.emails.join(', '),
    phonesText: contact.phones.join(', '),
    website: contact.website ?? '',
    linkedinUrl: contact.linkedinUrl ?? '',
    leadNote: contact.leadNote ?? '',
    followUpDate: contact.followUpDate ?? '',
    notes: contact.notes ?? '',
    captureMode: (contact.captureMode ?? 'legacy') as CaptureMode,
    eventSessionId: contact.eventSessionId ?? undefined,
    leadQualifier: contact.leadQualifier ?? undefined,
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Edit contact</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Update lead details, category, and event assignment.
      </Text>
      <ContactForm
        initialValues={initialValues}
        sessions={sessionsQuery.data?.items ?? []}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save contact"
        onSubmit={(payload) => {
          if (!payload.fullName.trim()) {
            Alert.alert(
              'Full name required',
              'Please enter a name before saving.',
            );
            return;
          }
          updateMutation.mutate(payload);
        }}
      />
    </ScrollView>
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
  loadingText: {},
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, marginBottom: 20, lineHeight: 20, fontSize: 14 },
});
