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
    organizations: ['admin', 'organizations'] as const,
    plans: ['admin', 'plans'] as const,
  },
  analytics: {
    funnel: (organizationId?: string) =>
      ['analytics', 'funnel', organizationId ?? 'self'] as const,
    encounters: (organizationId?: string) =>
      ['analytics', 'encounters', organizationId ?? 'self'] as const,
    sessions: (organizationId?: string) =>
      ['analytics', 'sessions', organizationId ?? 'self'] as const,
    platform: ['analytics', 'platform'] as const,
  },
  billing: {
    subscription: ['billing', 'subscription'] as const,
  },
};
