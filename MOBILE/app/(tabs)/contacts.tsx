import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import CameraScannerModal from '@/components/CameraScannerModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import { fetchContacts } from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import { initials } from '@/lib/format';

function getAvatarBg(name: string): string {
  const colors = [
    '#A855F7', // Purple
    '#F97316', // Orange
    '#FB923C', // Light Orange
    '#0D9488', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky Blue
    '#EC4899', // Pink
  ];
  if (!name) return colors[0];
  const charCodeSum = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins <= 0 ? 1 : diffMins} hour${diffMins > 1 ? 's' : ''} ago`; // Matching screenshot style "2 hours ago"
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return `${diffDays} days ago`;
}

export default function ContactsScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['contacts', q],
    queryFn: () => fetchContacts(api, { q: q || undefined, limit: 50 }),
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Contacts</Text>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.muted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.search, { color: colors.text }]}
          placeholder="Search name, company, role"
          value={q}
          onChangeText={setQ}
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.accent} />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.muted} />
              <Text style={[styles.empty, { color: colors.muted }]}>
                No contacts found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const subtitle = item.title
              ? `${item.title}${item.company ? ` · ${item.company}` : ''}`
              : item.company || item.emails[0] || '—';

            return (
              <Pressable
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/contact/[id]',
                    params: { id: item.id },
                  })
                }
              >
                {/* Left Avatar circle */}
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: getAvatarBg(item.fullName) },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {initials(item.fullName)}
                  </Text>
                </View>

                {/* Contact Info */}
                <View style={styles.info}>
                  <Text
                    style={[styles.name, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.fullName}
                  </Text>
                  <Text
                    style={[styles.subtitle, { color: colors.muted }]}
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                </View>

                {/* Relative Time */}
                <Text style={[styles.time, { color: colors.muted }]}>
                  {formatRelativeTime(item.createdAt)}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      {/* FAB */}
      <Pressable
        style={[
          styles.fab,
          { bottom: 56 + (insets.bottom > 0 ? insets.bottom : 8) + 16 },
        ]}
        onPress={() => setScannerVisible(true)}
      >
        <Ionicons name="camera" size={24} color="#FFFFFF" />
      </Pressable>

      {/* Camera Scan Modal */}
      <CameraScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  search: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F0F8',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  empty: {
    fontSize: 14,
    color: COLORS.muted,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E2D4A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
});
