import NetInfo from '@react-native-community/netinfo';

import { api } from '@/lib/api';
import { submitOcrJob } from '@/lib/api-client';
import {
  getLastSyncedAt,
  loadPendingCaptures,
  removePendingCapture,
  setLastSyncedAt,
  updatePendingCapture,
} from '@/lib/sync/offline-queue';
import type { CaptureMode, EncounterType } from '@/lib/types';
import { useSyncStore } from '@/stores/sync-store';

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error ? String((error as Error).message) : '';
  return (
    message.includes('Network Error') ||
    message.includes('network request failed') ||
    message.includes('Failed to fetch') ||
    message.includes('timeout')
  );
}

export class OfflineQueuedError extends Error {
  constructor() {
    super('Capture saved offline. It will sync when you reconnect.');
    this.name = 'OfflineQueuedError';
  }
}

export async function refreshSyncState(): Promise<void> {
  const [items, lastSyncedAt] = await Promise.all([
    loadPendingCaptures(),
    getLastSyncedAt(),
  ]);
  useSyncStore.getState().setPendingItems(items);
  useSyncStore.getState().setLastSyncedAt(lastSyncedAt);
}

export async function drainSyncQueue(): Promise<void> {
  const { isOnline, syncStatus } = useSyncStore.getState();
  if (!isOnline || syncStatus === 'syncing') return;

  const queue = await loadPendingCaptures();
  const pending = queue.filter(
    (item) => item.status === 'pending' || item.status === 'failed',
  );
  if (!pending.length) {
    useSyncStore.getState().setSyncStatus('idle');
    return;
  }

  useSyncStore.getState().setSyncStatus('syncing');
  let hadError = false;

  for (const item of pending) {
    await updatePendingCapture(item.id, {
      status: 'syncing',
      errorMessage: undefined,
    });
    await refreshSyncState();
    try {
      await submitOcrJob(
        api,
        { uri: item.imageUri, name: item.fileName, type: item.mimeType },
        {
          captureMode: item.captureMode,
          sessionId: item.sessionId,
          clientIdempotencyKey: item.clientIdempotencyKey,
        },
      );
      await removePendingCapture(item.id);
    } catch (error) {
      hadError = true;
      await updatePendingCapture(item.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Sync failed',
      });
      if (isNetworkError(error)) break;
    }
    await refreshSyncState();
  }

  if (!hadError) {
    const syncedAt = new Date().toISOString();
    await setLastSyncedAt(syncedAt);
    useSyncStore.getState().setLastSyncedAt(syncedAt);
    useSyncStore.getState().setSyncStatus('idle');
  } else {
    useSyncStore.getState().setSyncStatus('error');
  }
  await refreshSyncState();
}

export function startSyncListeners(): () => void {
  void refreshSyncState();

  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = Boolean(
      state.isConnected && state.isInternetReachable !== false,
    );
    useSyncStore.getState().setOnline(online);
    if (online) {
      void drainSyncQueue();
    }
  });

  return unsubscribe;
}

export async function submitOcrWithOfflineFallback(
  file: { uri: string; name: string; type: string },
  payload: {
    captureMode: CaptureMode;
    sessionId?: string;
    clientIdempotencyKey: string;
    encounterType?: EncounterType;
  },
) {
  const { isOnline } = useSyncStore.getState();
  if (!isOnline) {
    const { enqueuePendingCapture } = await import('@/lib/sync/offline-queue');
    await enqueuePendingCapture({
      clientIdempotencyKey: payload.clientIdempotencyKey,
      imageUri: file.uri,
      fileName: file.name,
      mimeType: file.type,
      captureMode: payload.captureMode,
      sessionId: payload.sessionId,
      encounterType: payload.encounterType,
    });
    await refreshSyncState();
    throw new OfflineQueuedError();
  }

  try {
    const job = await submitOcrJob(api, file, payload);
    const syncedAt = new Date().toISOString();
    await setLastSyncedAt(syncedAt);
    useSyncStore.getState().setLastSyncedAt(syncedAt);
    return job;
  } catch (error) {
    if (isNetworkError(error)) {
      const { enqueuePendingCapture } =
        await import('@/lib/sync/offline-queue');
      await enqueuePendingCapture({
        clientIdempotencyKey: payload.clientIdempotencyKey,
        imageUri: file.uri,
        fileName: file.name,
        mimeType: file.type,
        captureMode: payload.captureMode,
        sessionId: payload.sessionId,
        encounterType: payload.encounterType,
      });
      await refreshSyncState();
      throw new OfflineQueuedError();
    }
    throw error;
  }
}
