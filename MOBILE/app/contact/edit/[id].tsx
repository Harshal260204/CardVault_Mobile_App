import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ContactForm, type ContactFormValues } from '@/components/contact-form';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { api } from '@/lib/api';
import {
  fetchContact,
  fetchSessions,
  getApiErrorMessage,
  updateContact,
} from '@/lib/api-client';
import type { CaptureMode } from '@/lib/types';
import { space } from '@/tokens/spacing';

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
    },
  });

  if (contactQuery.isLoading || !contactQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="body" color={colors.muted}>
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
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="h2" color={colors.text} accessibilityRole="header">
        Edit contact
      </Text>
      <Text variant="body" color={colors.muted} style={styles.subtitle}>
        Update lead details, category, and event assignment.
      </Text>
      <View style={styles.formWrap}>
        <ContactForm
          initialValues={initialValues}
          sessions={sessionsQuery.data?.items ?? []}
          submitLabel="Save contact"
          onSubmit={async (payload, _meta) => {
            await updateMutation.mutateAsync(payload);
            router.replace({ pathname: '/contact/[id]', params: { id: id! } });
          }}
        />
      </View>
      {updateMutation.isError ? (
        <Text
          variant="caption"
          color={colors.tokens.error.text}
          style={styles.screenError}
          accessibilityLiveRegion="polite"
        >
          {getApiErrorMessage(updateMutation.error)}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: space[4], paddingBottom: space[8] },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space[5],
  },
  subtitle: { marginTop: space[2], marginBottom: space[4] },
  formWrap: { minHeight: 560 },
  screenError: {
    marginTop: space[3],
    textAlign: 'center',
  },
});
