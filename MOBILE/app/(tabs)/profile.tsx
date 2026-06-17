import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, clearAuth, getRefreshToken } from '@/lib/api';
import { logout } from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import { registerForPushNotifications } from '@/lib/push-notifications';
import { useAuthStore } from '@/stores/auth-store';
import { useSyncStore } from '@/stores/sync-store';
import { useThemeStore } from '@/stores/theme-store';

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function formatMemberDate(dateString: string | undefined): string {
  if (!dateString) return 'Jan 2024'; // Fallback
  const d = new Date(dateString);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isDark = theme === 'dark';

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: !!user,
  });

  React.useEffect(() => {
    if (user) {
      void registerForPushNotifications();
    }
  }, [user]);

  const signOut = async () => {
    try {
      await logout(api, getRefreshToken());
    } catch {
      // still clear local session if server logout fails
    }
    await clearAuth();
    clearSession();
    router.replace('/login');
  };

  const profile = me.data ?? user;
  const pendingCount = useSyncStore(
    (s) => s.pendingItems.filter((i) => i.status !== 'syncing').length,
  );

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['top', 'left', 'right']}
    >
      {me.isLoading && !profile ? (
        <ActivityIndicator
          color={COLORS.accent}
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : (
        <View style={styles.content}>
          {/* Avatar and Name */}
          <View style={styles.header}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {getInitials(profile?.fullName ?? profile?.email ?? '')}
              </Text>
            </View>
            <Text style={[styles.name, isDark && styles.textDark]}>
              {profile?.fullName ?? profile?.email ?? 'User'}
            </Text>
            <View style={styles.emailRow}>
              <Ionicons
                name="mail-outline"
                size={16}
                color={isDark ? '#94A3B8' : COLORS.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.email, isDark && styles.mutedTextDark]}>
                {profile?.email}
              </Text>
            </View>

            {/* Sales Badge */}
            <View style={[styles.badge, isDark && styles.badgeDark]}>
              <Ionicons
                name="shield-outline"
                size={14}
                color="#3B82F6"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.badgeText}>Sales</Text>
            </View>
          </View>

          {/* Details Section */}
          <Text style={[styles.sectionTitle, isDark && styles.textMutedDark]}>
            Account Details
          </Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, isDark && styles.mutedTextDark]}
              >
                Member since
              </Text>
              <Text style={[styles.detailValue, isDark && styles.textDark]}>
                {profile?.createdAt ? formatMemberDate(profile.createdAt) : '—'}
              </Text>
            </View>
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, isDark && styles.mutedTextDark]}
              >
                Cards scanned
              </Text>
              <Text style={[styles.detailValue, isDark && styles.textDark]}>
                {profile?.cardsScanned ?? 0}
              </Text>
            </View>
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, isDark && styles.mutedTextDark]}
              >
                Region
              </Text>
              <Text style={[styles.detailValue, isDark && styles.textDark]}>
                {profile?.email?.includes('.local') ? 'North America' : 'EMEA'}
              </Text>
            </View>
          </View>

          {/* Settings Section */}
          <Text style={[styles.sectionTitle, isDark && styles.textMutedDark]}>
            App Settings
          </Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.detailRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={isDark ? 'moon-outline' : 'sunny-outline'}
                  size={18}
                  color={isDark ? '#94A3B8' : '#64748B'}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[styles.detailLabel, isDark && styles.mutedTextDark]}
                >
                  Theme Mode
                </Text>
              </View>
              <View style={[styles.themeRow, isDark && styles.themeRowDark]}>
                <Pressable
                  style={[
                    styles.themeOption,
                    theme === 'light' && styles.themeOptionActive,
                  ]}
                  onPress={() => setTheme('light')}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      theme === 'light' && styles.themeOptionTextActive,
                      isDark && { color: '#94A3B8' },
                      theme === 'light' && { color: '#ffffff' },
                    ]}
                  >
                    Light
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.themeOption,
                    theme === 'dark' && styles.themeOptionActive,
                  ]}
                  onPress={() => setTheme('dark')}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      theme === 'dark' && styles.themeOptionTextActive,
                      isDark && { color: '#94A3B8' },
                      theme === 'dark' && { color: '#ffffff' },
                    ]}
                  >
                    Dark
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.notificationsBtn, isDark && styles.cardDark]}
            onPress={() => router.push('/sessions/browse')}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={isDark ? '#94A3B8' : '#64748B'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.notificationsText, isDark && styles.textDark]}>
              Browse sessions
            </Text>
          </Pressable>

          <Pressable
            style={[styles.notificationsBtn, isDark && styles.cardDark]}
            onPress={() => router.push('/sync-status')}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={isDark ? '#94A3B8' : '#64748B'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.notificationsText, isDark && styles.textDark]}>
              Sync status{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.notificationsBtn, isDark && styles.cardDark]}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons
              name="notifications-outline"
              size={18}
              color={isDark ? '#94A3B8' : '#64748B'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.notificationsText, isDark && styles.textDark]}>
              Notifications
            </Text>
          </Pressable>

          <Pressable
            style={[styles.logoutBtn, isDark && styles.logoutBtnDark]}
            onPress={signOut}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color="#EF4444"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F07167',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  email: {
    fontSize: 13,
    color: '#64748B',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderColor: '#DBEAFE',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8F0F8',
    width: '100%',
    paddingVertical: 6,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 18,
  },
  notificationsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 20,
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  notificationsText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 20,
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  textDark: {
    color: '#F8FAFC',
  },
  mutedTextDark: {
    color: '#94A3B8',
  },
  textMutedDark: {
    color: '#64748B',
  },
  dividerDark: {
    backgroundColor: '#334155',
  },
  badgeDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  logoutBtnDark: {
    backgroundColor: '#1E293B',
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    width: '100%',
  },
  themeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
    alignItems: 'center',
  },
  themeRowDark: {
    backgroundColor: '#0F172A',
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  themeOptionActive: {
    backgroundColor: '#3B82F6',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  themeOptionTextActive: {
    color: '#ffffff',
  },
});
