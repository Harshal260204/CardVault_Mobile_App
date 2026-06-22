import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ContactForm, type ContactFormValues } from '@/components/contact-form';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { api } from '@/lib/api';
import {
  createContact,
  fetchSessions,
} from '@/lib/api-client';
import type { CaptureMode } from '@/lib/types';
import { space } from '@/tokens/spacing';

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
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
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="h2" color={colors.text} accessibilityRole="header">
        Create contact
      </Text>
      <Text variant="body" color={colors.muted} style={styles.subtitle}>
        Add a contact manually in four quick steps.
      </Text>
      <View style={styles.formWrap}>
        <ContactForm
          initialValues={initialValues}
          sessions={sessionsQuery.data?.items ?? []}
          submitLabel="Save Contact"
          showSaveAndAddAnother
          onSubmit={async (payload, { addAnother }) => {
            await createMutation.mutateAsync(payload);
            if (!addAnother) {
              router.replace('/(tabs)/contacts');
            }
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: space[4], paddingBottom: space[8] },
  subtitle: { marginTop: space[2], marginBottom: space[4] },
  formWrap: { minHeight: 560 },
});
