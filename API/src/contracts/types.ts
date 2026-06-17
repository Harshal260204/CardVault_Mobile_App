/** API contract types — keep in sync with WEB/lib/types.ts and MOBILE/lib/types.ts */

export type UserRole =
  | 'employee'
  | 'manager'
  | 'tenant_admin'
  | 'platform_support'
  | 'platform_super_admin';

export type CaptureMode = 'visitor' | 'exhibitor' | 'quick_capture' | 'legacy';

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  cursor?: string | null;
  correlationId?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  version: string;
  timestamp: string;
  services: {
    database: 'up' | 'down' | 'unknown';
    redis: 'up' | 'down' | 'unknown';
  };
  migrations?: {
    status: 'ok' | 'pending';
    warnings?: string[];
  };
}
