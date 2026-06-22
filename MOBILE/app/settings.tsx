import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { useThemeColors } from '@/theme/useThemeColors';
import { space } from '@/tokens/spacing';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function SettingsScreen() {
  const { mode, setMode } = useTheme();
  const colors = useThemeColors();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h2" color={colors.text} style={styles.title}>
          Settings
        </Text>

        <Card elevation={1} style={styles.section}>
          <View style={styles.row}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={colors.muted}
            />
            <View style={styles.rowText}>
              <Text variant="bodyStrong" color={colors.text}>
                Appearance
              </Text>
              <Text variant="caption" color={colors.muted}>
                Choose light, dark, or match your device
              </Text>
            </View>
          </View>

          <SegmentedControl
            accessibilityLabel="Theme mode"
            options={THEME_OPTIONS}
            value={mode}
            onChange={setMode}
            style={styles.segmented}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: space[4],
    gap: space[4],
  },
  title: {
    marginBottom: space[2],
  },
  section: {
    gap: space[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
  rowText: {
    flex: 1,
    gap: space[1],
  },
  segmented: {
    marginTop: space[1],
  },
});
