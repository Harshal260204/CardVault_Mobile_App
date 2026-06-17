import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { ImageUpload } from '@/lib/api-client';
import { buildApiUrl } from '@/lib/api-config';
import { getAccessToken } from '@/lib/api-config';
import { captureLog } from '@/lib/capture-logger';
import type { ApiResponse, CaptureMode, OcrJobRecord } from '@/lib/types';
import { ensureUuid } from '@/lib/uuid';

function correlationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Android content:// URIs must be copied before multipart upload. */
export async function resolveUploadUri(
  uri: string,
  fileName: string,
): Promise<string> {
  if (Platform.OS === 'android' && !uri.startsWith('file://')) {
    const dest = `${FileSystem.cacheDirectory ?? ''}${fileName}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest.startsWith('file://') ? dest : `file://${dest}`;
  }
  if (
    Platform.OS === 'android' &&
    uri.startsWith('/') &&
    !uri.startsWith('file://')
  ) {
    return `file://${uri}`;
  }
  return uri;
}

function parseUploadError(status: number, body: string): Error {
  try {
    const json = JSON.parse(body) as {
      error?: { message?: string | string[] };
      message?: string;
    };
    const raw = json.error?.message ?? json.message;
    const message = Array.isArray(raw) ? raw.join('; ') : raw;
    if (message) {
      return new Error(message);
    }
  } catch {
    // not JSON
  }
  return new Error(`Upload failed (${status})`);
}

type RNFilePart = { uri: string; name: string; type: string };

/**
 * fetch + FormData — reliable on Android (FileSystem.uploadAsync can drop http:// scheme).
 */
async function submitOcrJobFetch(
  url: string,
  uploadUri: string,
  file: ImageUpload,
  fileName: string,
  parameters: Record<string, string>,
  token: string,
): Promise<OcrJobRecord> {
  const formData = new FormData();
  const part: RNFilePart = {
    uri: uploadUri,
    name: fileName,
    type: file.type || 'image/jpeg',
  };
  formData.append('image', part as unknown as Blob);
  for (const [key, value] of Object.entries(parameters)) {
    formData.append(key, value);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Correlation-ID': correlationId(),
      'X-Client-Platform': 'cardvault-mobile',
    },
    body: formData,
  });

  const body = await response.text();
  if (!response.ok) {
    throw parseUploadError(response.status, body);
  }

  const parsed = JSON.parse(body) as ApiResponse<OcrJobRecord>;
  return parsed.data;
}

/**
 * iOS fallback: legacy FileSystem multipart upload.
 */
async function submitOcrJobFileSystem(
  url: string,
  uploadUri: string,
  file: ImageUpload,
  parameters: Record<string, string>,
  token: string,
): Promise<OcrJobRecord> {
  const response = await FileSystem.uploadAsync(url, uploadUri, {
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'image',
    mimeType: file.type || 'image/jpeg',
    httpMethod: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Correlation-ID': correlationId(),
      'X-Client-Platform': 'cardvault-mobile',
    },
    parameters,
  });

  if (response.status < 200 || response.status >= 300) {
    throw parseUploadError(response.status, response.body);
  }

  const parsed = JSON.parse(response.body) as ApiResponse<OcrJobRecord>;
  return parsed.data;
}

/**
 * Multipart OCR upload — fetch on Android, FileSystem on iOS.
 */
export async function submitOcrJobNative(
  file: ImageUpload,
  payload: {
    captureMode: CaptureMode;
    sessionId?: string;
    clientIdempotencyKey: string;
  },
): Promise<OcrJobRecord> {
  const clientIdempotencyKey = ensureUuid(payload.clientIdempotencyKey);
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not signed in. Please log in again.');
  }

  const fileName = file.name || `card-${Date.now()}.jpg`;
  const uploadUri = await resolveUploadUri(file.uri, fileName);

  const parameters: Record<string, string> = {
    captureMode: String(payload.captureMode),
    clientIdempotencyKey,
  };
  if (payload.sessionId) {
    parameters.sessionId = String(payload.sessionId);
  }

  const url = buildApiUrl('/ocr/jobs');
  captureLog.uploadStarted({
    captureMode: payload.captureMode,
    sessionId: payload.sessionId,
    clientIdempotencyKey,
    fileName,
    mimeType: file.type,
    uploadUrl: url,
  });

  try {
    const job =
      Platform.OS === 'android'
        ? await submitOcrJobFetch(
            url,
            uploadUri,
            file,
            fileName,
            parameters,
            token,
          )
        : await submitOcrJobFileSystem(url, uploadUri, file, parameters, token);

    captureLog.uploadSuccess(job.id, job.status);
    return job;
  } catch (error) {
    captureLog.uploadFailed(error);
    throw error;
  }
}
