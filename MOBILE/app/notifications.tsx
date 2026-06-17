import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  fetchNotifications,
  fetchUnreadNotificationCount,
  getApiErrorMessage,
  markNotificationRead,
} from '@/lib/api-client';

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const qc = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(api, { limit: 50 }),
    refetchInterval: 30000,
  });
  const unread = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => fetchUnreadNotificationCount(api),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(api, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      <Text style={[styles.count, { color: colors.muted }]}>
        {unread.data ?? 0} unread
      </Text>

      {notifications.isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : notifications.isError ? (
        <Text style={styles.error}>
          {getApiErrorMessage(notifications.error)}
        </Text>
      ) : notifications.data?.items.length ? (
        notifications.data.items.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
              !item.isRead && {
                borderColor: colors.accent,
                backgroundColor: colors.isDark ? '#1E3A5F' : '#EFF6FF',
              },
            ]}
            onPress={() => !item.isRead && markRead.mutate(item.id)}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.cardBody, { color: colors.text }]}>
              {item.body}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.muted }]}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </Pressable>
        ))
      ) : (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.empty, { color: colors.muted }]}>
            No notifications yet.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800' },
  count: { marginTop: 4, marginBottom: 16 },
  card: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
  cardBody: { lineHeight: 20 },
  cardMeta: { marginTop: 8, fontSize: 12 },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  empty: { textAlign: 'center' },
  error: { color: '#DC2626', marginTop: 24 },
});
