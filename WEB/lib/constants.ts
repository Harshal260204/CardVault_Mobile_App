export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

/** Same-origin BFF proxy prefix — browser never talks to NestJS directly. */
export const BFF_PROXY_PATH = '/api/proxy';

export const DESIGN = {
  MOBILE_FRAME_WIDTH: 390,
  MOBILE_FRAME_HEIGHT: 844,
  COLORS: {
    PRIMARY: '#1E3A5F',
    ACCENT: '#3B82F6',
    BACKGROUND: '#F8FAFC',
    TEXT: '#1E293B',
    WARNING: '#F59E0B',
    SUCCESS: '#16A34A',
    ERROR: '#DC2626',
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cardvault_access_token',
  REFRESH_TOKEN: 'cardvault_refresh_token',
  USER: 'cardvault_user',
} as const;
