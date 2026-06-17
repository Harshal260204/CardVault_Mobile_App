import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { STORAGE_KEYS } from '@/lib/constants';
import type { PendingCaptureRecord } from '@/lib/types';
import { randomUuid } from '@/lib/uuid';

async function readQueue(): Promise<PendingCaptureRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingCaptureRecord[];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingCaptureRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(items));
}

export async function loadPendingCaptures(): Promise<PendingCaptureRecord[]> {
  return readQueue();
}

export async function enqueuePendingCapture(
  item: Omit<PendingCaptureRecord, 'id' | 'createdAt' | 'status'>,
): Promise<PendingCaptureRecord> {
  const queue = await readQueue();
  const persistedUri = await persistImageForQueue(item.imageUri, item.fileName);
  const record: PendingCaptureRecord = {
    ...item,
    id: randomUuid(),
    imageUri: persistedUri,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  queue.push(record);
  await writeQueue(queue);
  return record;
}

async function persistImageForQueue(
  uri: string,
  fileName: string,
): Promise<string> {
  const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!baseDir) return uri;
  const dest = `${baseDir}sync-queue/${Date.now()}-${fileName}`;
  const dir = `${baseDir}sync-queue`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function updatePendingCapture(
  id: string,
  patch: Partial<Pick<PendingCaptureRecord, 'status' | 'errorMessage'>>,
): Promise<void> {
  const queue = await readQueue();
  const next = queue.map((item) =>
    item.id === id ? { ...item, ...patch } : item,
  );
  await writeQueue(next);
}

export async function removePendingCapture(id: string): Promise<void> {
  const queue = await readQueue();
  const target = queue.find((item) => item.id === id);
  if (
    target?.imageUri.startsWith('file://') ||
    target?.imageUri.includes('/')
  ) {
    try {
      await FileSystem.deleteAsync(target.imageUri, { idempotent: true });
    } catch {
      // ignore cleanup errors
    }
  }
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function setLastSyncedAt(iso: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNCED_AT, iso);
}

export async function getLastSyncedAt(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNCED_AT);
}
