import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { formatEncounterType } from '@/lib/format';
import type { EncounterType } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';

const ENCOUNTER_TYPES: EncounterType[] = [
  'flight',
  'b2b',
  'airport',
  'dinner',
  'referral',
  'hallway',
  'other',
];

const ENCOUNTER_META: Record<
  EncounterType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  flight: {
    icon: 'airplane-outline',
    description: 'Met during travel or on a flight.',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  b2b: {
    icon: 'briefcase-outline',
    description: 'Scheduled business meeting.',
    iconBg: '#F1F5F9',
    iconColor: '#475569',
  },
  airport: {
    icon: 'location-outline',
    description: 'Chance encounter at an airport.',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  dinner: {
    icon: 'restaurant-outline',
    description: 'Met over a meal or social dinner.',
    iconBg: '#FCE7F3',
    iconColor: '#DB2777',
  },
  referral: {
    icon: 'people-outline',
    description: 'Introduced by someone you know.',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
  },
  hallway: {
    icon: 'walk-outline',
    description: 'Brief chat in passing.',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  other: {
    icon: 'ellipsis-horizontal-outline',
    description: 'Another type of encounter.',
    iconBg: '#F1F5F9',
    iconColor: '#64748B',
  },
};

export default function EncounterSelectScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

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
        <View
          style={[
            styles.heroIconBg,
            { backgroundColor: isDark ? '#065F46' : '#F0FDF4' },
          ]}
        >
          <Ionicons
            name="flash-outline"
            size={22}
            color={isDark ? '#34D399' : '#16A34A'}
          />
        </View>
        <View style={styles.heroContent}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Quick Capture
          </Text>
          <Text style={[styles.heroDesc, { color: colors.muted }]}>
            How did you meet this contact? Pick an encounter type before
            scanning.
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.muted }]}>
        Encounter type
      </Text>

      {ENCOUNTER_TYPES.map((type) => {
        const meta = ENCOUNTER_META[type];
        return (
          <Pressable
            key={type}
            style={[
              styles.tile,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => {
              setActiveSession(undefined, 'quick_capture', type);
              router.replace('/(tabs)/home?openScanner=1');
            }}
          >
            <View
              style={[
                styles.tileIconBg,
                { backgroundColor: isDark ? '#0F172A' : meta.iconBg },
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={20}
                color={isDark ? '#94A3B8' : meta.iconColor}
              />
            </View>
            <View style={styles.tileContent}>
              <Text style={[styles.tileTitle, { color: colors.text }]}>
                {formatEncounterType(type)}
              </Text>
              <Text style={[styles.tileDesc, { color: colors.muted }]}>
                {meta.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  heroIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  heroDesc: { fontSize: 13, lineHeight: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  tileIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileContent: { flex: 1 },
  tileTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  tileDesc: { fontSize: 11, lineHeight: 14 },
});
