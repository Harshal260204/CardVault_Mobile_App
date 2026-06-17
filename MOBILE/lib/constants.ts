export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const COLORS = {
  primary: '#1E3A5F',
  accent: '#3B82F6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#F59E0B',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cardvault_access_token',
  REFRESH_TOKEN: 'cardvault_refresh_token',
  USER: 'cardvault_user',
  SYNC_QUEUE: 'cardvault_sync_queue',
  LAST_SYNCED_AT: 'cardvault_last_synced_at',
} as const;
