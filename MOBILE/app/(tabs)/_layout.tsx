import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';

function TabLabel({
  title,
  focused,
  colors,
}: {
  title: string;
  focused: boolean;
  colors: any;
}) {
  return (
    <Text
      style={[
        styles.label,
        { color: colors.muted },
        focused && { fontWeight: '600', color: colors.accent },
      ]}
    >
      {title}
    </Text>
  );
}

export default function TabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 56 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false, // We hide default headers for custom header rendering inside screens
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
            height: tabBarHeight,
            paddingBottom: bottomPadding,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: ({ focused }) => (
            <TabLabel title="Home" focused={focused} colors={colors} />
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size - 2}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarLabel: ({ focused }) => (
            <TabLabel title="Contacts" focused={focused} colors={colors} />
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={size - 2}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title: 'Export',
          tabBarLabel: ({ focused }) => (
            <TabLabel title="Export" focused={focused} colors={colors} />
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'download' : 'download-outline'}
              size={size - 2}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: ({ focused }) => (
            <TabLabel title="Profile" focused={focused} colors={colors} />
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size - 2}
              color={color}
            />
          ),
        }}
      />
      {/* Hide events and scan from bottom tab bar */}
      <Tabs.Screen
        name="events"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabBarItem: {
    height: 48,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
});
