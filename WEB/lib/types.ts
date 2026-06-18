/** Shared domain types — aligned with Backend Schema v3.0 */

export type UserRole =
  | 'employee'
  | 'manager'
  | 'tenant_admin'
  | 'platform_support'
  | 'platform_super_admin'
  | 'user'
  | 'super_admin';

export type CaptureMode = 'visitor' | 'exhibitor' | 'quick_capture' | 'legacy';

export type LeadQualifier = 'hot' | 'warm' | 'cold';

export type SessionStatus = 'active' | 'closed' | 'archived';

export type OcrStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'manual_fallback';

export type ExportStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'expired';

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  cursor?: string | null;
  correlationId?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  field?: string;
  correlationId?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
  error?: ApiErrorBody;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  version: string;
  timestamp: string;
  services: {
    database: 'up' | 'down' | 'unknown';
    redis: 'up' | 'down' | 'unknown';
  };
}

export interface ContactRecord {
  id: string;
  createdById: string;
  fullName: string;
  company: string | null;
  title: string | null;
  emails: string[];
  phones: string[];
  website: string | null;
  notes: string | null;
  tags: string[];
  captureMode: CaptureMode | null;
  eventSessionId: string | null;
  encounterType: string | null;
  leadQualifier: LeadQualifier | null;
  leadNote: string | null;
  followUpDate: string | null;
  ocrConfidence: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventSessionRecord {
  id: string;
  createdById: string;
  name: string;
  mode: CaptureMode;
  eventType: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  status: SessionStatus;
  scanCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrgUserRecord {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface PaginatedList<T> {
  items: T[];
  meta: Required<Pick<ApiMeta, 'page' | 'limit' | 'total'>>;
}

export interface DashboardStats {
  totals: {
    contacts: number;
    users: number;
    activeSessions: number;
    exports: number;
  };
  leads: { hot: number; warm: number; cold: number; unqualified: number };
  captureModes: Record<string, number>;
  capturesByDay: Array<{ date: string; count: number }>;
  recentActivity: Array<{
    id: string;
    eventType: string;
    entityType: string;
    actorEmail: string | null;
    createdAt: string;
  }>;
}

export interface AuditEventRecord {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  eventType: string;
  entityType: string;
  entityId: string | null;
  eventData: Record<string, unknown>;
  correlationId: string | null;
  createdAt: string;
}

export interface OcrRelationshipMatch {
  id: string;
  matchedContactId: string;
  matchedContactName: string;
  matchedContactCompany: string | null;
  matchConfidence: number;
  matchSignals: Record<string, unknown>;
  userDecision: string | null;
}

export interface OcrJobRecord {
  id: string;
  contactId: string | null;
  cardImageId: string;
  sessionId: string | null;
  captureMode: CaptureMode | null;
  status: OcrStatus;
  rawText: string | null;
  extractedFields: Record<string, unknown>;
  confidenceScores: Record<string, number>;
  meanConfidence: number | null;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  matches: OcrRelationshipMatch[];
}

export interface ExportJobRecord {
  id: string;
  requestedById: string;
  exportType: string;
  sessionId: string | null;
  status: ExportStatus;
  recordCount: number | null;
  signedUrl: string | null;
  signedUrlExpiresAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
