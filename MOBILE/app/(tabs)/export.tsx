import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/lib/api';
import {
  createExportJob,
  fetchContacts,
  fetchExportJob,
} from '@/lib/api-client';
import { buildApiUrl, getAccessToken } from '@/lib/api-config';
import { COLORS } from '@/lib/constants';

const LAST_EXPORT_KEY = 'cardvault_last_export_time';

async function downloadExportFile(jobId: string, format: 'csv' | 'xlsx') {
  const url = buildApiUrl(`/exports/${jobId}/download`);
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not signed in.');
  }
  const ext = format === 'xlsx' ? 'xlsx' : 'csv';
  const fileUri = `${FileSystem.documentDirectory ?? ''}cardvault-export.${ext}`;
  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Download failed (${result.status})`);
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType:
        format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv',
      dialogTitle: `Export Contacts as ${format.toUpperCase()}`,
    });
  } else {
    Alert.alert('Export ready', `File saved to ${result.uri}`);
  }
}

async function pollExportReady(jobId: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const job = await fetchExportJob(api, jobId);
    if (job.status === 'ready') {
      return job;
    }
    if (job.status === 'failed' || job.status === 'expired') {
      throw new Error(
        job.status === 'failed'
          ? 'Export job failed on server.'
          : 'Export expired.',
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Export timed out. Try again from the admin console.');
}

export default function ExportScreen() {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const [exporting, setExporting] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem(LAST_EXPORT_KEY).then((val) => {
      if (val) setLastExported(val);
    });
  }, []);

  const contactsQuery = useQuery({
    queryKey: ['contacts', 'all'],
    queryFn: () => fetchContacts(api, { limit: 200 }),
  });

  const totalContacts = contactsQuery.data?.meta?.total ?? 0;

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (totalContacts === 0) {
      Alert.alert('No Contacts', 'You do not have any contacts to export.');
      return;
    }

    setExporting(true);

    try {
      const job = await createExportJob(api, { exportType: format });
      const ready = await pollExportReady(job.id);
      await downloadExportFile(ready.id, format);

      const nowStr = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const formattedTime = nowStr.replace(/,([^,]*)$/, ' -$1');
      await AsyncStorage.setItem(LAST_EXPORT_KEY, formattedTime);
      setLastExported(formattedTime);
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Unknown error during export.',
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Export My Contacts
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Request a server-side export of your contacts (CSV or Excel).
        </Text>

        <View
          style={[
            styles.totalBanner,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.totalText, { color: colors.muted }]}>
            Total contacts
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalContacts}</Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <Pressable
            style={[
              styles.cardCsv,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => handleExport('csv')}
            disabled={exporting}
          >
            <View
              style={[
                styles.iconBg,
                { backgroundColor: isDark ? '#334155' : '#EFF6FF' },
              ]}
            >
              <Ionicons
                name="document-text"
                size={24}
                color={isDark ? '#60A5FA' : COLORS.accent}
              />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Export as CSV
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
                Server-generated CSV file
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.cardExcel}
            onPress={() => handleExport('xlsx')}
            disabled={exporting}
          >
            <View
              style={[
                styles.iconBg,
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              ]}
            >
              <Ionicons name="grid" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                Export as Excel
              </Text>
              <Text style={[styles.cardSubtitle, { color: '#93C5FD' }]}>
                Server-generated .xlsx file
              </Text>
            </View>
          </Pressable>
        </View>

        {exporting && (
          <View style={styles.exportingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={[styles.exportingText, { color: colors.muted }]}>
              Preparing export on server…
            </Text>
          </View>
        )}

        {lastExported && (
          <Text style={[styles.statusText, { color: colors.muted }]}>
            Last exported: {lastExported}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 6, marginBottom: 24 },
  totalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E8F0F8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    width: 160,
    justifyContent: 'space-between',
  },
  totalText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  badge: {
    backgroundColor: '#1E2D4A',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  optionsContainer: { gap: 16 },
  cardCsv: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8F0F8',
  },
  cardExcel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2D4A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  exportingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    justifyContent: 'center',
  },
  exportingText: { fontSize: 13 },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 24,
  },
});
