import { create } from 'zustand';

export type ContactSaveSyncStatus = 'syncing' | 'synced';

export interface ContactSaveActivity {
  id: string;
  fullName: string;
  syncStatus: ContactSaveSyncStatus;
  createdAt: string;
}

interface ContactSaveStore {
  items: ContactSaveActivity[];
  startSave: (id: string, fullName: string) => void;
  markSynced: (id: string) => void;
  removeSave: (id: string) => void;
  getSyncCaption: (fullName: string) => string | undefined;
}

export const useContactSaveStore = create<ContactSaveStore>((set, get) => ({
  items: [],
  startSave: (id, fullName) =>
    set((state) => ({
      items: [
        {
          id,
          fullName,
          syncStatus: 'syncing',
          createdAt: new Date().toISOString(),
        },
        ...state.items,
      ],
    })),
  markSynced: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, syncStatus: 'synced' as const } : item,
      ),
    })),
  removeSave: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  getSyncCaption: (fullName) => {
    const item = get().items.find(
      (entry) => entry.fullName.toLowerCase() === fullName.toLowerCase(),
    );
    if (!item) return undefined;
    return item.syncStatus === 'syncing' ? 'Syncing…' : 'Synced ✓';
  },
}));
