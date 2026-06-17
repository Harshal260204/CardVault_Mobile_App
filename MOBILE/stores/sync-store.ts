import { create } from 'zustand';

import type { PendingCaptureRecord, SyncStatus } from '@/lib/types';

interface SyncStore {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingItems: PendingCaptureRecord[];
  lastSyncedAt: string | null;
  setOnline: (isOnline: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setPendingItems: (items: PendingCaptureRecord[]) => void;
  setLastSyncedAt: (iso: string | null) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isOnline: true,
  syncStatus: 'idle',
  pendingItems: [],
  lastSyncedAt: null,
  setOnline: (isOnline) =>
    set({ isOnline, syncStatus: isOnline ? 'idle' : 'offline' }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setPendingItems: (pendingItems) => set({ pendingItems }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));
