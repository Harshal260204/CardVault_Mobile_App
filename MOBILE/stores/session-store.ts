import { create } from 'zustand';

import type {
  CaptureMode,
  EncounterType,
  EventSessionRecord,
} from '@/lib/types';

interface SessionState {
  activeSessionId: string | undefined;
  activeMode: CaptureMode;
  activeEncounterType: EncounterType | undefined;
  sessions: EventSessionRecord[];
  setActiveSession: (
    sessionId: string | undefined,
    mode?: CaptureMode,
    encounterType?: EncounterType,
  ) => void;
  setSessions: (sessions: EventSessionRecord[]) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: undefined,
  activeMode: 'visitor',
  activeEncounterType: undefined,
  sessions: [],
  setActiveSession: (activeSessionId, activeMode, activeEncounterType) =>
    set((s) => ({
      activeSessionId,
      activeMode: activeMode ?? s.activeMode,
      activeEncounterType:
        activeEncounterType !== undefined
          ? activeEncounterType
          : s.activeEncounterType,
    })),
  setSessions: (sessions) => set({ sessions }),
}));
