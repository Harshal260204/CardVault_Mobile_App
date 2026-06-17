import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { createSession, getApiErrorMessage } from '@/lib/api-client';
import { formatCaptureMode } from '@/lib/format';
import { useSessionStore } from '@/stores/session-store';

const MODES = ['visitor', 'exhibitor', 'quick_capture'] as const;
type EventCaptureMode = (typeof MODES)[number];

const MODE_META: Record<
  EventCaptureMode,
  { icon: keyof typeof Ionicons.glyphMap; description: string; badge: string }
> = {
  visitor: {
    icon: 'business-outline',
    description: 'Structured capture tied to an event agenda and booths.',
    badge: 'Event-linked',
  },
  exhibitor: {
    icon: 'briefcase-outline',
    description: 'Fast capture with lead qualification and team live view.',
    badge: 'Live stats',
  },
  quick_capture: {
    icon: 'flash-outline',
    description: 'Direct scan to your contact list without an event.',
    badge: 'No event link',
  },
};

export default function CreateEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialMode?: string }>();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const [name, setName] = useState('');

  const getInitialMode = (): EventCaptureMode => {
    const init = params.initialMode;
    if (
      init === 'exhibitor' ||
      init === 'visitor' ||
      init === 'quick_capture'
    ) {
      return init;
    }
    return 'visitor';
  };

  const [mode, setMode] = useState<EventCaptureMode>(getInitialMode);
  const [eventType, setEventType] = useState('');
  const [location, setLocation] = useState('');

  const lockedMode =
    params.initialMode === 'visitor' ||
    params.initialMode === 'exhibitor' ||
    params.initialMode === 'quick_capture'
      ? params.initialMode
      : undefined;
  const activeMode: EventCaptureMode = lockedMode ?? mode;
  const modeMeta = MODE_META[activeMode];

  const createEvent = useMutation({
    mutationFn: () =>
      createSession(api, {
        name: name.trim(),
        mode: activeMode,
        eventType: eventType.trim() || undefined,
        location: location.trim() || undefined,
      }),
    onSuccess: async (session) => {
      setActiveSession(session.id, session.mode);
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.replace({ pathname: '/events/[id]', params: { id: session.id } });
    },
    onError: (error) => {
      Alert.alert('Unable to create event', getApiErrorMessage(error));
    },
  });

  const submit = () => {
    if (!name.trim()) {
      Alert.alert(
        'Event name required',
        'Please enter an event name before continuing.',
      );
      return;
    }
    createEvent.mutate();
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text }]}>Create event</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {lockedMode
          ? `Set up details for your new ${formatCaptureMode(lockedMode)} session.`
          : 'Pick the category first so every scan is stored under the right bucket.'}
      </Text>

      {lockedMode ? (
        <View
          style={[
            styles.modeCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <View
            style={[
              styles.modeIconBg,
              { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
            ]}
          >
            <Ionicons
              name={modeMeta.icon}
              size={20}
              color={isDark ? '#94A3B8' : '#475569'}
            />
          </View>
          <View style={styles.modeCardContent}>
            <View style={styles.modeCardHeader}>
              <Text style={[styles.modeCardName, { color: colors.text }]}>
                {formatCaptureMode(lockedMode)}
              </Text>
              <View
                style={[
                  styles.modeBadge,
                  { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.modeBadgeText, { color: colors.muted }]}>
                  {modeMeta.badge}
                </Text>
              </View>
            </View>
            <Text style={[styles.modeCardDesc, { color: colors.muted }]}>
              {modeMeta.description}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            Category
          </Text>
          {MODES.map((value) => {
            const selected = value === mode;
            const meta = MODE_META[value];
            return (
              <Pressable
                key={value}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selected ? colors.accent : colors.cardBorder,
                  },
                  selected && {
                    backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF',
                  },
                ]}
                onPress={() => setMode(value)}
              >
                <View
                  style={[
                    styles.modeIconBg,
                    { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
                  ]}
                >
                  <Ionicons
                    name={meta.icon}
                    size={20}
                    color={
                      selected ? colors.accent : isDark ? '#94A3B8' : '#475569'
                    }
                  />
                </View>
                <View style={styles.modeCardContent}>
                  <View style={styles.modeCardHeader}>
                    <Text style={[styles.modeCardName, { color: colors.text }]}>
                      {formatCaptureMode(value)}
                    </Text>
                    <View
                      style={[
                        styles.modeBadge,
                        { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                      ]}
                    >
                      <Text
                        style={[styles.modeBadgeText, { color: colors.muted }]}
                      >
                        {meta.badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.modeCardDesc, { color: colors.muted }]}>
                    {meta.description}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.accent}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </>
      )}

      <Text
        style={[styles.sectionTitle, { color: colors.muted, marginTop: 8 }]}
      >
        Event details
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Event name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="AWS Meetup"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>
        Event type (optional)
      </Text>
      <TextInput
        value={eventType}
        onChangeText={setEventType}
        placeholder="Meetup, Expo, Conference"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>
        Location (optional)
      </Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Mumbai"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <Pressable
        style={[
          styles.primary,
          createEvent.isPending && styles.primaryDisabled,
        ]}
        onPress={submit}
        disabled={createEvent.isPending}
      >
        <Text style={styles.primaryText}>
          {createEvent.isPending ? 'Creating...' : 'Create event'}
        </Text>
        {!createEvent.isPending ? (
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
        ) : null}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, marginBottom: 20, lineHeight: 20, fontSize: 14 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  modeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardContent: { flex: 1 },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  modeCardName: { fontSize: 14, fontWeight: '700' },
  modeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  modeBadgeText: { fontSize: 9, fontWeight: '600' },
  modeCardDesc: { fontSize: 11, lineHeight: 14 },
  primary: {
    flexDirection: 'row',
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  primaryDisabled: { opacity: 0.7 },
  primaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
