import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { captureLog } from '@/lib/capture-logger';
import { API_BASE_PATH } from '@/lib/constants';
import { submitOcrJobNative } from '@/lib/submit-ocr-upload';
import type {
  ApiResponse,
  ContactEncounterRecord,
  ContactRecord,
  EventSessionRecord,
  LoginResponse,
  OcrJobRecord,
  PaginatedList,
  UserProfile,
  CaptureMode,
  ExportJobRecord,
  SessionMemberRecord,
  SessionStatsRecord,
} from '@/lib/types';

export interface ApiClientConfig {
  baseURL: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokensRefreshed?: (access: string, refresh: string) => void | Promise<void>;
  onUnauthorized?: () => void | Promise<void>;
}

function correlationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: `${config.baseURL.replace(/\/$/, '')}${API_BASE_PATH}`,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((req: InternalAxiosRequestConfig) => {
    const token = config.getAccessToken?.();
    if (token) req.headers.Authorization = `Bearer ${token}`;
    req.headers['X-Correlation-ID'] = correlationId();
    req.headers['X-Client-Platform'] = 'cardvault-mobile';
    // Let axios set multipart boundary — default application/json breaks file uploads
    if (req.data instanceof FormData) {
      delete req.headers['Content-Type'];
    }
    return req;
  });

  let refreshPromise: Promise<string | null> | null = null;

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
      const isRefreshRequest = original?.url?.includes('/auth/refresh');

      if (error.response?.status === 401 && isRefreshRequest) {
        await config.onUnauthorized?.();
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        const refresh = config.getRefreshToken?.();
        if (refresh) {
          refreshPromise ??= axios
            .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
              `${config.baseURL.replace(/\/$/, '')}${API_BASE_PATH}/auth/refresh`,
              {
                refreshToken: refresh,
              },
              {
                timeout: 30_000,
                headers: {
                  'Content-Type': 'application/json',
                  'X-Correlation-ID': correlationId(),
                  'X-Client-Platform': 'cardvault-mobile',
                },
              },
            )
            .then((r) => {
              const tokens = r.data.data;
              return Promise.resolve(
                config.onTokensRefreshed?.(
                  tokens.accessToken,
                  tokens.refreshToken,
                ),
              ).then(() => tokens.accessToken);
            })
            .catch(async () => {
              await config.onUnauthorized?.();
              return null;
            })
            .finally(() => {
              refreshPromise = null;
            });
          const newToken = await refreshPromise;
          if (newToken) {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${newToken}`;
            return client(original);
          }
        } else {
          await config.onUnauthorized?.();
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

export async function register(
  client: AxiosInstance,
  email: string,
  password: string,
  fullName?: string,
): Promise<LoginResponse> {
  const { data } = await client.post<ApiResponse<LoginResponse>>(
    '/auth/register',
    { email, password, fullName },
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
  params?: {
    page?: number;
    limit?: number;
    q?: string;
    sessionId?: string;
    mode?: CaptureMode;
  },
): Promise<PaginatedList<ContactRecord>> {
  const normalizedParams = {
    ...params,
    limit: params?.limit ? Math.min(params.limit, 100) : params?.limit,
  };
  const { data } = await client.get<ApiResponse<ContactRecord[]>>('/contacts', {
    params: normalizedParams,
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

export async function fetchContactEncounters(
  client: AxiosInstance,
  contactId: string,
): Promise<ContactEncounterRecord[]> {
  const { data } = await client.get<ApiResponse<ContactEncounterRecord[]>>(
    `/contacts/${contactId}/encounters`,
  );
  return data.data;
}

export async function fetchSessions(
  client: AxiosInstance,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    mine?: boolean;
  },
): Promise<PaginatedList<EventSessionRecord>> {
  const normalizedParams = {
    ...params,
    limit: params?.limit ? Math.min(params.limit, 100) : params?.limit,
  };
  const { data } = await client.get<ApiResponse<EventSessionRecord[]>>(
    '/sessions',
    {
      params: normalizedParams,
    },
  );
  return {
    items: data.data,
    meta: {
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 10,
      total: data.meta?.total ?? data.data.length,
    },
  };
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

export async function createSession(
  client: AxiosInstance,
  payload: {
    name: string;
    mode: CaptureMode;
    eventType?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<EventSessionRecord> {
  const { data } = await client.post<ApiResponse<EventSessionRecord>>(
    '/sessions',
    payload,
  );
  return data.data;
}

export async function updateSession(
  client: AxiosInstance,
  id: string,
  payload: {
    name?: string;
    eventType?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<EventSessionRecord> {
  const { data } = await client.patch<ApiResponse<EventSessionRecord>>(
    `/sessions/${id}`,
    payload,
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

export async function deleteSession(
  client: AxiosInstance,
  id: string,
): Promise<{ id: string; deleted: true }> {
  const { data } = await client.delete<
    ApiResponse<{ id: string; deleted: true }>
  >(`/sessions/${id}`);
  return data.data;
}

export async function joinSession(
  client: AxiosInstance,
  id: string,
): Promise<{ joined: boolean }> {
  const { data } = await client.post<ApiResponse<{ joined: boolean }>>(
    `/sessions/${id}/join`,
  );
  return data.data;
}

export async function fetchSessionStats(
  client: AxiosInstance,
  id: string,
): Promise<SessionStatsRecord> {
  const { data } = await client.get<ApiResponse<SessionStatsRecord>>(
    `/sessions/${id}/stats`,
  );
  return data.data;
}

export async function fetchSessionMembers(
  client: AxiosInstance,
  id: string,
): Promise<SessionMemberRecord[]> {
  const { data } = await client.get<ApiResponse<SessionMemberRecord[]>>(
    `/sessions/${id}/members`,
  );
  return data.data;
}

export async function fetchImageUrl(
  client: AxiosInstance,
  imageId: string,
): Promise<{ url: string; expiresIn: number }> {
  const { data } = await client.get<
    ApiResponse<{ url: string; expiresIn: number }>
  >(`/images/${imageId}/url`);
  return data.data;
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

export async function fetchExportJob(
  client: AxiosInstance,
  id: string,
): Promise<ExportJobRecord> {
  const { data } = await client.get<ApiResponse<ExportJobRecord>>(
    `/exports/${id}`,
  );
  return data.data;
}

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications(
  client: AxiosInstance,
  params?: { page?: number; limit?: number; unreadOnly?: boolean },
): Promise<PaginatedList<NotificationRecord>> {
  const { data } = await client.get<ApiResponse<NotificationRecord[]>>(
    '/notifications',
    {
      params,
    },
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

export async function fetchUnreadNotificationCount(
  client: AxiosInstance,
): Promise<number> {
  const { data } = await client.get<ApiResponse<{ count: number }>>(
    '/notifications/unread-count',
  );
  return data.data.count;
}

export async function markNotificationRead(
  client: AxiosInstance,
  id: string,
): Promise<void> {
  await client.patch(`/notifications/${id}/read`);
}

export async function registerPushDevice(
  client: AxiosInstance,
  expoPushToken: string,
): Promise<void> {
  await client.post('/notifications/register-device', { expoPushToken });
}

export async function createContact(
  client: AxiosInstance,
  payload: {
    fullName: string;
    company?: string;
    title?: string;
    emails?: string[];
    phones?: string[];
    website?: string;
    linkedinUrl?: string;
    leadNote?: string;
    followUpDate?: string;
    notes?: string;
    captureMode?: CaptureMode;
    eventSessionId?: string;
    leadQualifier?: 'hot' | 'warm' | 'cold';
  },
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
  payload: {
    fullName?: string;
    company?: string;
    title?: string;
    emails?: string[];
    phones?: string[];
    website?: string;
    linkedinUrl?: string;
    leadNote?: string;
    followUpDate?: string;
    notes?: string;
    captureMode?: CaptureMode;
    eventSessionId?: string;
    leadQualifier?: 'hot' | 'warm' | 'cold';
  },
): Promise<ContactRecord> {
  const { data } = await client.patch<ApiResponse<ContactRecord>>(
    `/contacts/${id}`,
    payload,
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

export type ImageUpload = { uri: string; name: string; type: string };

export async function submitOcrJob(
  _client: AxiosInstance,
  file: ImageUpload,
  payload: {
    captureMode: CaptureMode;
    sessionId?: string;
    clientIdempotencyKey: string;
  },
): Promise<OcrJobRecord> {
  return submitOcrJobNative(file, payload);
}

export async function fetchOcrJob(
  client: AxiosInstance,
  id: string,
): Promise<OcrJobRecord> {
  captureLog.jobFetchStarted(id);
  try {
    const { data } = await client.get<ApiResponse<OcrJobRecord>>(
      `/ocr/jobs/${id}`,
    );
    const job = data.data;
    if (__DEV__) {
      console.log('OCR JOB RESPONSE', JSON.stringify(job, null, 2));
    }
    captureLog.jobStatus(id, job.status, {
      meanConfidence: job.meanConfidence,
      matchCount: job.matches?.length ?? 0,
    });
    if (
      job.status === 'completed' ||
      job.status === 'manual_fallback' ||
      job.status === 'failed'
    ) {
      captureLog.jobExtractionResult({
        jobId: id,
        status: job.status,
        rawText: job.rawText,
        errorMessage: job.errorMessage,
        extractedFields: job.extractedFields,
        meanConfidence: job.meanConfidence,
      });
    }
    return job;
  } catch (error) {
    captureLog.jobFetchFailed(id, error);
    throw error;
  }
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
    encounterType?: string;
    duplicateAction?: 'new' | 'link';
    linkToContactId?: string;
  },
): Promise<{ job: OcrJobRecord; contact: ContactRecord }> {
  captureLog.confirmStarted(id, {
    fullName: payload.fullName,
    company: payload.company,
    leadQualifier: payload.leadQualifier,
    duplicateAction: payload.duplicateAction,
    linkToContactId: payload.linkToContactId,
    emailCount: payload.emails?.length ?? 0,
    phoneCount: payload.phones?.length ?? 0,
  });

  try {
    const { data } = await client.post<
      ApiResponse<{ job: OcrJobRecord; contact: ContactRecord }>
    >(`/ocr/jobs/${id}/confirm`, payload);
    captureLog.confirmSuccess(id, data.data.contact.id);
    return data.data;
  } catch (error) {
    captureLog.confirmFailed(id, error);
    throw error;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (__DEV__ && error.code) {
        console.warn(
          '[CardCapture] network error code:',
          error.code,
          error.message,
        );
      }
      const base = error.config?.baseURL ?? '';
      const path = error.config?.url ?? '';
      const target = `${base}${path}`;
      if (error.code === 'ECONNABORTED') {
        return `Request timed out reaching ${target}. Is the API running?`;
      }
      const host = base.replace(/\/api\/v1\/?$/, '');
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return `Cannot reach API at ${target}. On a real phone, localhost is the phone — set EXPO_PUBLIC_API_URL in MOBILE/.env to your PC LAN IP (e.g. http://192.168.0.106:8000), then restart Expo.`;
      }
      return `Cannot reach API at ${target}. Check Wi‑Fi, firewall, and that the API listens on 0.0.0.0:${host.split(':').pop() ?? '8000'}.`;
    }
    const body = error.response?.data as {
      error?: { message?: string | string[] };
      message?: string | string[];
    };
    const raw = body?.error?.message ?? body?.message;
    if (Array.isArray(raw)) {
      return raw.join('; ');
    }
    if (typeof raw === 'string' && raw.length > 0) {
      return raw;
    }
    return `Request failed (${error.response.status})`;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong';
}

export { axios };
