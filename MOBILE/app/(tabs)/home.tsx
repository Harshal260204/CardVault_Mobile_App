import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { KPICard, KPI_CARD_WIDTH } from '@/components/KPICard';
import { ScanIllustration } from '@/components/onboarding/illustrations';
import ScanBottomSheet from '@/components/ScanBottomSheet';
import { SessionCard, SESSION_CARD_WIDTH } from '@/components/SessionCard';
import {
  SkeletonCard,
  SkeletonKPICard,
  SkeletonSessionCard,
} from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { api } from '@/lib/api';
import { fetchContacts, fetchSessions, getApiErrorMessage } from '@/lib/api-client';
import {
  formatLeadLabel,
  formatRelativeTime,
  initials,
} from '@/lib/format';
import type { ContactRecord, EventSessionRecord } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import { useContactSaveStore } from '@/stores/contact-save-store';
import { useSessionStore } from '@/stores/session-store';
import { useSyncStore } from '@/stores/sync-store';
import { stagger } from '@/tokens/motion';
import { haptics } from '@/utils/haptics';
import { pressScale, useFadeIn } from '@/utils/motion';
import { radius, space } from '@/tokens/spacing';

const KPI_SNAP_INTERVAL = KPI_CARD_WIDTH + space[4];
const SESSION_SNAP_INTERVAL = SESSION_CARD_WIDTH + space[4];
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getGreeting(): string {
  const hrs = new Date().getHours();
  if (hrs < 12) return 'Good morning';
  if (hrs < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildTrend(value: number): number[] {
  return [
    Math.max(value - 3, 0),
    Math.max(value - 2, 0),
    Math.max(value - 1, 0),
    value,
  ];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface ActivityFeedRowProps {
  item: ContactRecord;
  index: number;
  syncCaption: string | undefined;
  onPress: () => void;
}

function ActivityFeedRow({
  item,
  index,
  syncCaption,
  onPress,
}: ActivityFeedRowProps) {
  const colors = useThemeColors();
  const entranceDelay = Math.min(index * stagger.step, stagger.max);
  const fadeInStyle = useFadeIn(entranceDelay);

  return (
    <Animated.View style={fadeInStyle}>
      <Card
        elevation={1}
        onPress={onPress}
        style={styles.activityCard}
        accessibilityLabel={`${item.fullName}, ${syncCaption ?? formatRelativeTime(item.createdAt)}`}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.isDark
                ? colors.getElevationSurface(2)
                : colors.tokens.primary[100],
            },
          ]}
        >
          <Text variant="caption" color={colors.primaryOnTint}>
            {initials(item.fullName)}
          </Text>
        </View>
        <View style={styles.activityBody}>
          <Text variant="bodyStrong" color={colors.text} numberOfLines={2}>
            {item.fullName}
          </Text>
          <Text
            variant="caption"
            color={
              syncCaption === 'Synced ✓'
                ? colors.tokens.success.text
                : syncCaption === 'Syncing…'
                  ? colors.tokens.info.text
                  : colors.muted
            }
            accessibilityLiveRegion={syncCaption ? 'polite' : undefined}
          >
            {syncCaption ?? formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Badge
          label={formatLeadLabel(item.leadQualifier)}
          lead={item.leadQualifier}
        />
      </Card>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { openScanner } = useLocalSearchParams<{ openScanner?: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const pendingCount = useSyncStore(
    (s) => s.pendingItems.filter((i) => i.status !== 'syncing').length,
  );
  const getSyncCaption = useContactSaveStore((s) => s.getSyncCaption);

  const [scanVisible, setScanVisible] = useState(false);
  const scanScale = useSharedValue(1);

  React.useEffect(() => {
    if (openScanner === '1') {
      setScanVisible(true);
      router.replace('/(tabs)/home');
    }
  }, [openScanner, router]);

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: !!user,
  });

  const contacts = useQuery({
    queryKey: ['contacts', 'recent'],
    queryFn: () => fetchContacts(api, { limit: 100 }),
  });

  const sessions = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () =>
      fetchSessions(api, { limit: 10, status: 'active', mine: true }),
  });

  const profile = me.data ?? user;
  const firstName = profile?.fullName?.split(' ')[0] ?? 'there';
  const isLoading = contacts.isLoading || sessions.isLoading;

  const contactItems = contacts.data?.items ?? [];
  const sessionItems = sessions.data?.items ?? [];
  const totalContacts = contacts.data?.meta?.total ?? contactItems.length;
  const activeSessionCount = sessionItems.length;

  const todayCount = useMemo(
    () =>
      contactItems.filter((contact) =>
        isSameDay(new Date(contact.createdAt), new Date()),
      ).length,
    [contactItems],
  );

  const recentActivity = useMemo(
    () =>
      [...contactItems]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 8),
    [contactItems],
  );

  const isEmpty =
    !isLoading &&
    contactItems.length === 0 &&
    sessionItems.length === 0 &&
    !contacts.isError &&
    !sessions.isError;

  const lastSyncedAt = contacts.dataUpdatedAt
    ? new Date(contacts.dataUpdatedAt).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const syncCaption = contacts.isError
    ? 'Offline'
    : pendingCount > 0
      ? `${pendingCount} pending sync`
      : lastSyncedAt
        ? `Synced ${lastSyncedAt}`
        : 'Synced';

  const syncDotColor = contacts.isError
    ? colors.tokens.error.text
    : pendingCount > 0
      ? colors.tokens.warning.text
      : colors.tokens.success.text;

  const openScanSheet = useCallback(() => {
    setScanVisible(true);
  }, []);

  const handleResumeSession = useCallback(
    (session: EventSessionRecord) => {
      setActiveSession(session.id, session.mode);
      setScanVisible(true);
    },
    [setActiveSession],
  );

  const scanAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanScale.value }],
  }));

  const onScanPressIn = useCallback(() => {
    void haptics.light();
    pressScale(scanScale, true);
  }, [scanScale]);

  const onScanPressOut = useCallback(() => {
    pressScale(scanScale, false);
  }, [scanScale]);

  const quickActions: QuickAction[] = [
    {
      key: 'visitor',
      label: 'Visitor',
      icon: 'business-outline',
      onPress: () =>
        router.push({
          pathname: '/events/create',
          params: { initialMode: 'visitor' },
        }),
    },
    {
      key: 'exhibitor',
      label: 'Exhibitor',
      icon: 'briefcase-outline',
      onPress: () =>
        router.push({
          pathname: '/events/create',
          params: { initialMode: 'exhibitor' },
        }),
    },
    {
      key: 'manual',
      label: 'Manual entry',
      icon: 'create-outline',
      onPress: () => router.push('/contact/create'),
    },
  ];

  const renderActivityRow: ListRenderItem<ContactRecord> = useCallback(
    ({ item, index }) => (
      <ActivityFeedRow
        item={item}
        index={index}
        syncCaption={getSyncCaption(item.fullName)}
        onPress={() => router.push(`/contact/${item.id}`)}
      />
    ),
    [getSyncCaption, router],
  );

  const listHeader = (
    <View style={styles.headerContent}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text
            variant="h2"
            color={colors.text}
            accessibilityRole="header"
            style={styles.greeting}
          >
            {getGreeting()}, {firstName}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sync status: ${syncCaption}`}
            accessibilityHint="Opens sync status details"
            onPress={() => router.push('/sync-status')}
            style={styles.syncRow}
          >
            <View
              style={[styles.syncDot, { backgroundColor: syncDotColor }]}
            />
            <Text
              variant="caption"
              color={colors.muted}
              accessibilityLiveRegion="polite"
            >
              {syncCaption}
            </Text>
          </Pressable>
        </View>
        <Card
          elevation={1}
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.settingsButton}
          accessibilityLabel="Open settings"
          accessibilityHint="Opens app settings and preferences"
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={colors.text}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          />
        </Card>
      </View>

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="Scan a business card"
        accessibilityHint="Opens the camera scanner to capture a new contact"
        onPress={openScanSheet}
        onPressIn={onScanPressIn}
        onPressOut={onScanPressOut}
        style={[
          styles.scanCta,
          scanAnimatedStyle,
          { backgroundColor: colors.tokens.accent[500] },
        ]}
      >
        <Ionicons
          name="camera-outline"
          size={22}
          color={colors.tokens.neutral[0]}
        />
        <Text variant="bodyStrong" color={colors.tokens.neutral[0]}>
          Scan a card
        </Text>
      </AnimatedPressable>

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
        >
          <SkeletonKPICard />
          <SkeletonKPICard />
          <SkeletonKPICard />
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={KPI_SNAP_INTERVAL}
          snapToAlignment="start"
          contentContainerStyle={styles.kpiRow}
        >
          <KPICard
            value={totalContacts}
            label="Contacts"
            trend={buildTrend(totalContacts)}
            accentColor={colors.tokens.primary[500]}
          />
          <KPICard
            value={todayCount}
            label="Today"
            trend={buildTrend(todayCount)}
            accentColor={colors.accent}
          />
          <KPICard
            value={activeSessionCount}
            label="Active Sessions"
            trend={buildTrend(activeSessionCount)}
            accentColor={colors.tokens.success.text}
          />
        </ScrollView>
      )}

      <View style={styles.sectionHeader}>
        <Text variant="h3" color={colors.text} accessibilityRole="header">
          Active Sessions
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="See all active sessions"
          onPress={() => router.push('/sessions/browse')}
          style={styles.seeAllButton}
        >
          <Text variant="bodyStrong" color={colors.tokens.primary[500]}>
            See all
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sessionRow}
        >
          <SkeletonSessionCard />
          <SkeletonSessionCard />
          <SkeletonSessionCard />
        </ScrollView>
      ) : sessions.isError ? (
        <Text variant="caption" color={colors.tokens.error.text}>
          {getApiErrorMessage(sessions.error)}
        </Text>
      ) : sessionItems.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SESSION_SNAP_INTERVAL}
          snapToAlignment="start"
          contentContainerStyle={styles.sessionRow}
        >
          {sessionItems.map((session) => (
            <SessionCard
              key={session.id}
              title={session.name}
              subtitle={`${session.mode.replace('_', ' ')} · ${
                session.status === 'active' ? 'active now' : session.status
              }`}
              contactCount={session.scanCount}
              onPress={() => handleResumeSession(session)}
              style={styles.sessionCardSpacing}
              thumbnail={
                <View
                  style={[
                    styles.sessionThumb,
                    {
                      backgroundColor:
                        session.mode === 'exhibitor'
                          ? colors.tokens.primary[100]
                          : colors.tokens.neutral[100],
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      session.mode === 'exhibitor'
                        ? 'briefcase'
                        : 'people-outline'
                    }
                    size={22}
                    color={
                      session.mode === 'exhibitor'
                        ? colors.tokens.primary[500]
                        : colors.muted
                    }
                  />
                </View>
              }
            />
          ))}
        </ScrollView>
      ) : (
        <Text variant="caption" color={colors.muted}>
          No active sessions right now.
        </Text>
      )}

      <Text
        variant="h3"
        color={colors.text}
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        Quick Actions
      </Text>
      <View style={styles.quickActionsRow}>
        {quickActions.map((action) => (
          <Card
            key={action.key}
            elevation={1}
            onPress={action.onPress}
            style={styles.quickActionChip}
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={20} color={colors.text} />
            <Text
              variant="caption"
              color={colors.text}
              style={styles.quickActionLabel}
              numberOfLines={2}
            >
              {action.label}
            </Text>
          </Card>
        ))}
      </View>

      <Text
        variant="h3"
        color={colors.text}
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        Recent Activity
      </Text>

      {isLoading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : null}
    </View>
  );

  if (isEmpty) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <EmptyState
          illustration={
            <ScanIllustration
              color={colors.text}
              accent={colors.tokens.primary[500]}
            />
          }
          headline="Start capturing leads"
          body="Scan your first business card or create a contact manually to populate your workspace."
          actionLabel="Scan a card"
          onAction={openScanSheet}
        />
        <ScanBottomSheet
          visible={scanVisible}
          onClose={() => setScanVisible(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <FlatList
        data={isLoading ? [] : recentActivity}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityRow}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + space[10] },
        ]}
        showsVerticalScrollIndicator={false}
      />

      <ScanBottomSheet
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: space[4],
    paddingTop: space[3],
  },
  headerContent: {
    gap: space[4],
    marginBottom: space[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space[3],
  },
  headerCopy: {
    flex: 1,
    gap: space[2],
  },
  greeting: {
    flexShrink: 1,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  settingsButton: {
    width: 44,
    height: 44,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCta: {
    minHeight: 56,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
  },
  kpiRow: {
    gap: space[4],
    paddingVertical: space[1],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
    marginTop: space[2],
  },
  seeAllButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space[2],
  },
  sessionRow: {
    gap: space[4],
    paddingVertical: space[1],
  },
  sessionCardSpacing: {
    marginBottom: 0,
  },
  sessionThumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: space[2],
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: space[3],
  },
  quickActionChip: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingVertical: space[3],
  },
  quickActionLabel: {
    textAlign: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginBottom: space[3],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: {
    flex: 1,
    gap: space[1],
    paddingRight: space[2],
  },
});
