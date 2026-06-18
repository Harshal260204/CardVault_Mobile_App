import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_BASE_PATH } from '@/lib/constants';
import type {
  ApiResponse,
  AuditEventRecord,
  ContactRecord,
  DashboardStats,
  EventSessionRecord,
  ExportJobRecord,
  HealthStatus,
  LoginResponse,
  OcrJobRecord,
  OrgUserRecord,
  PaginatedList,

  UserProfile,
  UserRole,
} from '@/lib/types';
import type { CaptureMode } from '@/lib/types';
import type { ContactSearchParams } from '@/lib/validation';

export interface ApiClientConfig {
  baseURL: string;
  /** When true, baseURL is the BFF proxy prefix and paths omit `/api/v1`. */
  useBffProxy?: boolean;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokensRefreshed?: (access: string, refresh: string) => void;
  onUnauthorized?: () => void;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const origin = (config.baseURL ?? '').replace(/\/$/, '');
  if (!origin) {
    throw new Error('createApiClient: baseURL is required');
  }

  const client = axios.create({
    baseURL: config.useBffProxy ? origin : `${origin}${API_BASE_PATH}`,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((req: InternalAxiosRequestConfig) => {
    const token = config.getAccessToken?.();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    req.headers['X-Correlation-ID'] = crypto.randomUUID();
    return req;
  });

  let refreshPromise: Promise<boolean> | null = null;

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
      if (error.response?.status === 401 && original && !original._retry) {
        original._retry = true;

        if (config.useBffProxy) {
          refreshPromise ??= axios
            .post<ApiResponse<{ ok: true }>>(
              '/api/auth/refresh',
              {},
              { withCredentials: true },
            )
            .then(() => true)
            .catch(() => {
              config.onUnauthorized?.();
              return false;
            })
            .finally(() => {
              refreshPromise = null;
            });
          const refreshed = await refreshPromise;
          if (refreshed) {
            return client(original);
          }
        } else {
          const refresh = config.getRefreshToken?.();
          if (refresh) {
            refreshPromise ??= client
              .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
                '/auth/refresh',
                {
                  refreshToken: refresh,
                },
              )
              .then((r) => {
                const tokens = r.data.data;
                config.onTokensRefreshed?.(
                  tokens.accessToken,
                  tokens.refreshToken,
                );
                original.headers.Authorization = `Bearer ${tokens.accessToken}`;
                return true;
              })
              .catch(() => {
                config.onUnauthorized?.();
                return false;
              })
              .finally(() => {
                refreshPromise = null;
              });
            const refreshed = await refreshPromise;
            if (refreshed) {
              return client(original);
            }
          } else {
            config.onUnauthorized?.();
          }
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}


export async function login(
  client: AxiosInstance,
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await client.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    { email, password },
  );
  return data.data;
}

export async function logout(
  client: AxiosInstance,
  refreshToken?: string | null,
): Promise<void> {
  await client.post('/auth/logout', {
    refreshToken: refreshToken ?? undefined,
  });
}

export async function fetchContacts(
  client: AxiosInstance,
  params?: ContactSearchParams,
): Promise<PaginatedList<ContactRecord>> {
  const { data } = await client.get<ApiResponse<ContactRecord[]>>('/contacts', {
    params,
  });
  return {
    items: data.data,
    meta: {
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 20,
      total: data.meta?.total ?? data.data.length,
    },
  };
}

export async function fetchContact(
  client: AxiosInstance,
  id: string,
): Promise<ContactRecord> {
  const { data } = await client.get<ApiResponse<ContactRecord>>(
    `/contacts/${id}`,
  );
  return data.data;
}

export async function deleteContact(
  client: AxiosInstance,
  id: string,
): Promise<{ id: string; deleted: true }> {
  const { data } = await client.delete<
    ApiResponse<{ id: string; deleted: true }>
  >(`/contacts/${id}`);
  return data.data;
}


export async function closeSession(
  client: AxiosInstance,
  id: string,
): Promise<EventSessionRecord> {
  const { data } = await client.post<ApiResponse<EventSessionRecord>>(
    `/sessions/${id}/close`,
  );
  return data.data;
}


export async function fetchSessions(
  client: AxiosInstance,
  params?: { page?: number; limit?: number; status?: string },
): Promise<PaginatedList<EventSessionRecord>> {
  const { data } = await client.get<ApiResponse<EventSessionRecord[]>>(
    '/sessions',
    { params },
  );
  return {
    items: data.data,
    meta: {
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 20,
      total: data.meta?.total ?? data.data.length,
    },
  };
}

export interface CreateContactPayload {
  fullName: string;
  company?: string;
  title?: string;
  emails?: string[];
  phones?: string[];
  website?: string;
  notes?: string;
  captureMode?: ContactRecord['captureMode'];
  eventSessionId?: string;
  encounterType?: string;
  leadQualifier?: ContactRecord['leadQualifier'];
  leadNote?: string;
}

export async function createContact(
  client: AxiosInstance,
  payload: CreateContactPayload,
): Promise<ContactRecord> {
  const { data } = await client.post<ApiResponse<ContactRecord>>(
    '/contacts',
    payload,
  );
  return data.data;
}

export async function updateContact(
  client: AxiosInstance,
  id: string,
  payload: Partial<CreateContactPayload>,
): Promise<ContactRecord> {
  const { data } = await client.patch<ApiResponse<ContactRecord>>(
    `/contacts/${id}`,
    payload,
  );
  return data.data;
}

export async function fetchMe(client: AxiosInstance): Promise<UserProfile> {
  const { data } = await client.get<ApiResponse<UserProfile>>('/auth/me');
  if (!data?.data) {
    throw new Error('Profile response missing user data');
  }
  return data.data;
}





export async function mergeContacts(
  client: AxiosInstance,
  targetId: string,
  sourceContactId: string,
): Promise<ContactRecord> {
  const { data } = await client.post<ApiResponse<ContactRecord>>(
    `/contacts/${targetId}/merge`,
    { sourceContactId },
  );
  return data.data;
}

export async function fetchDashboard(
  client: AxiosInstance,
  params?: { period?: string },
): Promise<DashboardStats> {
  const { data } = await client.get<ApiResponse<DashboardStats>>(
    '/admin/dashboard',
    { params },
  );
  return data.data;
}

export async function fetchAuditEvents(
  client: AxiosInstance,
  params?: {
    page?: number;
    limit?: number;
    q?: string;
    eventType?: string;
    entityType?: string;
  },
): Promise<PaginatedList<AuditEventRecord>> {
  const { data } = await client.get<ApiResponse<AuditEventRecord[]>>(
    '/audit-events',
    { params },
  );
  return {
    items: data.data,
    meta: {
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 20,
      total: data.meta?.total ?? data.data.length,
    },
  };
}

export async function fetchExports(
  client: AxiosInstance,
  params?: { page?: number; limit?: number },
): Promise<PaginatedList<ExportJobRecord>> {
  const { data } = await client.get<ApiResponse<ExportJobRecord[]>>(
    '/exports',
    { params },
  );
  return {
    items: data.data,
    meta: {
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 20,
      total: data.meta?.total ?? data.data.length,
    },
  };
}

export async function createExportJob(
  client: AxiosInstance,
  payload: {
    exportType: 'csv' | 'xlsx' | 'pdf';
    sessionId?: string;
    leadQualifier?: string;
    captureMode?: string;
  },
): Promise<ExportJobRecord> {
  const { data } = await client.post<ApiResponse<ExportJobRecord>>(
    '/exports',
    payload,
  );
  return data.data;
}

export async function updateOrgUser(
  client: AxiosInstance,
  id: string,
  payload: { fullName?: string; role?: UserRole; isActive?: boolean },
): Promise<OrgUserRecord> {
  const { data } = await client.patch<ApiResponse<OrgUserRecord>>(
    `/users/${id}`,
    payload,
  );
  return data.data;
}

export async function fetchOrgUsers(
  client: AxiosInstance,
  params?: {
    page?: number;
    limit?: number;
    role?: string;
    q?: string;
  },
): Promise<PaginatedList<OrgUserRecord>> {
  const { data } = await client.get<ApiResponse<OrgUserRecord[]>>('/users', {
    params,
  });
  return {
    items: data.data,
    meta: {
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 20,
      total: data.meta?.total ?? data.data.length,
    },
  };
}

export async function deleteOrgUser(
  client: AxiosInstance,
  id: string,
): Promise<{ id: string; deleted: true }> {
  const { data } = await client.delete<
    ApiResponse<{ id: string; deleted: true }>
  >(`/users/${id}`);
  return data.data;
}


export async function fetchLeadFunnel(
  client: AxiosInstance,
): Promise<{ hot: number; warm: number; cold: number; unqualified: number }> {
  const { data } = await client.get<
    ApiResponse<{
      hot: number;
      warm: number;
      cold: number;
      unqualified: number;
    }>
  >('/analytics/lead-funnel');
  return data.data;
}

export async function fetchEncounterTypeAnalytics(
  client: AxiosInstance,
): Promise<Array<{ encounterType: string | null; count: number }>> {
  const { data } = await client.get<
    ApiResponse<Array<{ encounterType: string | null; count: number }>>
  >('/analytics/encounter-types');
  return data.data;
}

export async function fetchSessionAnalytics(
  client: AxiosInstance,
): Promise<
  Array<{
    id: string;
    name: string;
    mode: string;
    status: string;
    scanCount: number;
    hotCount: number;
    warmCount: number;
    coldCount: number;
  }>
> {
  const { data } = await client.get<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        mode: string;
        status: string;
        scanCount: number;
        hotCount: number;
        warmCount: number;
        coldCount: number;
      }>
    >
  >('/analytics/sessions');
  return data.data;
}

export async function fetchPlatformAnalytics(client: AxiosInstance): Promise<{
  organizations: number;
  users: number;
  contacts: number;
  ocrJobs: number;
} | null> {
  const { data } = await client.get<
    ApiResponse<{
      organizations: number;
      users: number;
      contacts: number;
      ocrJobs: number;
    } | null>
  >('/analytics/platform');
  return data.data;
}



export { axios };
