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
  OrganizationRecord,
  OcrJobRecord,
  OrgUserRecord,
  PaginatedList,
  PlanRecord,
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

export async function healthCheck(
  client: AxiosInstance,
): Promise<HealthStatus> {
  const { data } = await client.get<ApiResponse<HealthStatus>>('/health');
  return data.data;
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

export async function fetchSession(
  client: AxiosInstance,
  id: string,
): Promise<EventSessionRecord> {
  const { data } = await client.get<ApiResponse<EventSessionRecord>>(
    `/sessions/${id}`,
  );
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

export async function fetchSessionStats(
  client: AxiosInstance,
  id: string,
): Promise<{
  sessionId: string;
  scanCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  status: string;
}> {
  const { data } = await client.get<
    ApiResponse<{
      sessionId: string;
      scanCount: number;
      hotCount: number;
      warmCount: number;
      coldCount: number;
      status: string;
    }>
  >(`/sessions/${id}/stats`);
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

export async function submitOcrJob(
  client: AxiosInstance,
  file: File,
  payload: {
    captureMode: CaptureMode;
    sessionId?: string;
    clientIdempotencyKey: string;
  },
): Promise<OcrJobRecord> {
  const form = new FormData();
  form.append('image', file);
  form.append('captureMode', payload.captureMode);
  form.append('clientIdempotencyKey', payload.clientIdempotencyKey);
  if (payload.sessionId) {
    form.append('sessionId', payload.sessionId);
  }
  const { data } = await client.post<ApiResponse<OcrJobRecord>>(
    '/ocr/jobs',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data.data;
}

export async function fetchOcrJobs(
  client: AxiosInstance,
  params?: {
    page?: number;
    limit?: number;
    needsReview?: boolean;
    status?: string;
  },
): Promise<PaginatedList<OcrJobRecord>> {
  const { data } = await client.get<ApiResponse<OcrJobRecord[]>>('/ocr/jobs', {
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

export async function fetchOcrJob(
  client: AxiosInstance,
  id: string,
): Promise<OcrJobRecord> {
  const { data } = await client.get<ApiResponse<OcrJobRecord>>(
    `/ocr/jobs/${id}`,
  );
  return data.data;
}

export async function confirmOcrJob(
  client: AxiosInstance,
  id: string,
  payload: {
    fullName: string;
    company?: string;
    title?: string;
    emails?: string[];
    phones?: string[];
    leadQualifier?: string;
    duplicateAction?: 'new' | 'link';
    linkToContactId?: string;
  },
): Promise<{ job: OcrJobRecord; contact: ContactRecord }> {
  const { data } = await client.post<
    ApiResponse<{ job: OcrJobRecord; contact: ContactRecord }>
  >(`/ocr/jobs/${id}/confirm`, payload);
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
    organizationId?: string;
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

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
  plan?: string;
  maxUsers?: number;
  storageQuotaGb?: number;
  managerEmail?: string;
  managerPassword?: string;
  managerName?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  slug?: string;
  plan?: string;
  maxUsers?: number;
  storageQuotaGb?: number;
  isActive?: boolean;
}

export async function fetchOrganizations(
  client: AxiosInstance,
): Promise<OrganizationRecord[]> {
  const { data } = await client.get<ApiResponse<OrganizationRecord[]>>(
    '/admin/organizations',
  );
  return data.data;
}

export async function fetchPlans(client: AxiosInstance): Promise<PlanRecord[]> {
  const { data } = await client.get<ApiResponse<PlanRecord[]>>('/admin/plans');
  return data.data;
}

export async function createOrganization(
  client: AxiosInstance,
  payload: CreateOrganizationPayload,
): Promise<OrganizationRecord> {
  const { data } = await client.post<ApiResponse<OrganizationRecord>>(
    '/admin/organizations',
    payload,
  );
  return data.data;
}

export async function updateOrganization(
  client: AxiosInstance,
  id: string,
  payload: UpdateOrganizationPayload,
): Promise<OrganizationRecord> {
  const { data } = await client.patch<ApiResponse<OrganizationRecord>>(
    `/admin/organizations/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteOrganization(
  client: AxiosInstance,
  id: string,
): Promise<{ id: string; deleted: true }> {
  const { data } = await client.delete<
    ApiResponse<{ id: string; deleted: true }>
  >(`/admin/organizations/${id}`);
  return data.data;
}

export async function fetchLeadFunnel(
  client: AxiosInstance,
  organizationId?: string,
): Promise<{ hot: number; warm: number; cold: number; unqualified: number }> {
  const { data } = await client.get<
    ApiResponse<{
      hot: number;
      warm: number;
      cold: number;
      unqualified: number;
    }>
  >('/analytics/lead-funnel', {
    params: organizationId ? { organizationId } : undefined,
  });
  return data.data;
}

export async function fetchEncounterTypeAnalytics(
  client: AxiosInstance,
  organizationId?: string,
): Promise<Array<{ encounterType: string | null; count: number }>> {
  const { data } = await client.get<
    ApiResponse<Array<{ encounterType: string | null; count: number }>>
  >('/analytics/encounter-types', {
    params: organizationId ? { organizationId } : undefined,
  });
  return data.data;
}

export async function fetchSessionAnalytics(
  client: AxiosInstance,
  organizationId?: string,
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
  >('/analytics/sessions', {
    params: organizationId ? { organizationId } : undefined,
  });
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

export async function fetchBillingSubscription(client: AxiosInstance): Promise<{
  organizationId: string;
  plan: string;
  planName: string;
  planPriceInr: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingEnabled: boolean;
}> {
  const { data } = await client.get<
    ApiResponse<{
      organizationId: string;
      plan: string;
      planName: string;
      planPriceInr: number;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      billingEnabled: boolean;
    }>
  >('/billing/subscription');
  return data.data;
}

export async function createBillingCheckout(
  client: AxiosInstance,
  planCode: 'pro' = 'pro',
): Promise<{ url: string; sessionId: string }> {
  const { data } = await client.post<
    ApiResponse<{ url: string; sessionId: string }>
  >('/billing/checkout', { planCode });
  return data.data;
}

export async function createBillingPortal(
  client: AxiosInstance,
): Promise<{ url: string }> {
  const { data } =
    await client.post<ApiResponse<{ url: string }>>('/billing/portal');
  return data.data;
}

export { axios };
