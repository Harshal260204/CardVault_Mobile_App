export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const BULL_QUEUES = {
  OCR_PROCESSING: 'ocr-processing',
  DEDUPLICATION: 'deduplication',
  RELATIONSHIP_MATCHING: 'relationship-matching',
  IMAGE_PROCESSING: 'image-processing',
  EXPORT_GENERATION: 'export-generation',
  SYNC_INGEST: 'sync-ingest',
  SESSION_COUNTER_SYNC: 'session-counter-sync',
  AUDIT_WRITES: 'audit-writes',
} as const;
