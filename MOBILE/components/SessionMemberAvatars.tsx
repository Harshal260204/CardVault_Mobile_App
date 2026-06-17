import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/lib/api';
import { fetchSessionMembers } from '@/lib/api-client';

const AVATAR_COLORS = ['#F87171', '#FBBF24', '#F97316', '#60A5FA', '#34D399'];

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function SessionMemberAvatars({
  sessionId,
}: {
  sessionId: string;
}) {
  const members = useQuery({
    queryKey: ['session-members', sessionId],
    queryFn: () => fetchSessionMembers(api, sessionId),
  });

  const items = members.data ?? [];

  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {items.slice(0, 3).map((member, index) => (
        <View
          key={member.userId}
          style={[
            styles.avatarCircle,
            {
              backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
              zIndex: 3 - index,
              marginLeft: index === 0 ? 0 : -8,
            },
          ]}
        >
          <Text style={styles.avatarInitials}>
            {getInitials(member.fullName, member.email)}
          </Text>
        </View>
      ))}
      {items.length > 3 ? (
        <View
          style={[styles.avatarCircle, styles.moreCircle, { marginLeft: -8 }]}
        >
          <Text style={styles.avatarInitials}>+{items.length - 3}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreCircle: {
    backgroundColor: '#64748B',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
