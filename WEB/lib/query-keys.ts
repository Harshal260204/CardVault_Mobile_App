export const queryKeys = {
  contacts: {
    all: ['contacts'] as const,
    list: (params: Record<string, unknown>) =>
      ['contacts', 'list', params] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    list: (params: Record<string, unknown>) =>
      ['sessions', 'list', params] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    list: (params: Record<string, unknown>) =>
      ['users', 'list', params] as const,
  },
  ocr: {
    list: (params: Record<string, unknown>) => ['ocr', 'list', params] as const,
    detail: (id: string) => ['ocr', 'detail', id] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    audit: (params: Record<string, unknown>) =>
      ['admin', 'audit', params] as const,
    exports: (params: Record<string, unknown>) =>
      ['admin', 'exports', params] as const,
  },
  analytics: {
    funnel: () => ['analytics', 'funnel'] as const,
    encounters: () => ['analytics', 'encounters'] as const,
    sessions: () => ['analytics', 'sessions'] as const,
    platform: ['analytics', 'platform'] as const,
  },
};
