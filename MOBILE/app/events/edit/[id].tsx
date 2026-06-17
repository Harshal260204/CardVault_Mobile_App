import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
  closeSession,
  deleteSession,
  fetchSession,
  getApiErrorMessage,
  updateSession,
} from '@/lib/api-client';
import { formatCaptureMode } from '@/lib/format';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchSession(api, id!),
    enabled: !!id,
  });

  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!sessionQuery.data) return;
    setName(sessionQuery.data.name ?? '');
    setEventType(sessionQuery.data.eventType ?? '');
    setLocation(sessionQuery.data.location ?? '');
    setStartDate(sessionQuery.data.startDate ?? '');
    setEndDate(sessionQuery.data.endDate ?? '');
  }, [sessionQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateSession(api, id!, {
        name: name.trim(),
        eventType: eventType.trim() || undefined,
        location: location.trim() || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['session', id] }),
      ]);
      router.replace({ pathname: '/events/[id]', params: { id: id! } });
    },
    onError: (error) =>
      Alert.alert('Unable to update event', getApiErrorMessage(error)),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeSession(api, id!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['session', id] }),
      ]);
      router.replace({ pathname: '/events/[id]', params: { id: id! } });
    },
    onError: (error) =>
      Alert.alert('Unable to close event', getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSession(api, id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.replace('/(tabs)/events');
    },
    onError: (error) =>
      Alert.alert('Unable to delete event', getApiErrorMessage(error)),
  });

  if (sessionQuery.isLoading || !sessionQuery.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          {sessionQuery.isLoading
            ? 'Loading event...'
            : 'Unable to load event.'}
        </Text>
      </View>
    );
  }

  const session = sessionQuery.data;
  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.inputBg,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Edit event</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Category is fixed after creation: {formatCaptureMode(session.mode)}
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Event name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={inputStyle}
        placeholder="Event name"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.text }]}>Event type</Text>
      <TextInput
        value={eventType}
        onChangeText={setEventType}
        style={inputStyle}
        placeholder="Meetup, Expo, Conference"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.text }]}>Location</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        style={inputStyle}
        placeholder="Location"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.text }]}>Start date</Text>
      <TextInput
        value={startDate}
        onChangeText={setStartDate}
        style={inputStyle}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.text }]}>End date</Text>
      <TextInput
        value={endDate}
        onChangeText={setEndDate}
        style={inputStyle}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.placeholder}
      />

      <Pressable
        style={[
          styles.primaryButton,
          saveMutation.isPending && styles.disabledButton,
        ]}
        onPress={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        <Text style={styles.primaryButtonText}>
          {saveMutation.isPending ? 'Saving...' : 'Save changes'}
        </Text>
      </Pressable>

      {session.status !== 'closed' ? (
        <Pressable
          style={[
            styles.secondaryButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            closeMutation.isPending && styles.disabledButton,
          ]}
          onPress={() =>
            Alert.alert(
              'Close event',
              'You will no longer be able to scan into this event.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Close event', onPress: () => closeMutation.mutate() },
              ],
            )
          }
          disabled={closeMutation.isPending}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            {closeMutation.isPending ? 'Closing...' : 'Close event'}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        style={[
          styles.dangerButton,
          closeMutation.isPending && styles.disabledButton,
        ]}
        onPress={() =>
          Alert.alert(
            'Delete event',
            'This hides the event from the app. Existing records stay in the database.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete event',
                style: 'destructive',
                onPress: () => deleteMutation.mutate(),
              },
            ],
          )
        }
        disabled={deleteMutation.isPending}
      >
        <Text style={styles.dangerButtonText}>
          {deleteMutation.isPending ? 'Deleting...' : 'Delete event'}
        </Text>
      </Pressable>
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
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  secondaryButtonText: { fontWeight: '600', textAlign: 'center', fontSize: 16 },
  dangerButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  dangerButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  disabledButton: { opacity: 0.7 },
});
