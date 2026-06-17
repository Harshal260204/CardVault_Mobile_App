export type UserRole =
  | 'employee'
  | 'manager'
  | 'tenant_admin'
  | 'platform_support'
  | 'platform_super_admin';
export type CaptureMode = 'visitor' | 'exhibitor' | 'quick_capture' | 'legacy';
export type LeadQualifier = 'hot' | 'warm' | 'cold';
export type OcrStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'manual_fallback';

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
  error?: { code: string; message: string };
}

export interface UserProfile {
  id: string;
  organizationId: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  organizationName?: string;
  createdAt?: string;
  cardsScanned?: number;
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

export interface ContactRecord {
  id: string;
  organizationId?: string;
  createdById?: string;
  fullName: string;
  company: string | null;
  title: string | null;
  emails: string[];
  phones: string[];
  website?: string | null;
  address?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
  tags?: string[];
  leadQualifier: LeadQualifier | null;
  captureMode: CaptureMode | null;
  eventSessionId?: string | null;
  encounterType?: string | null;
  leadNote?: string | null;
  followUpDate?: string | null;
  ocrConfidence?: number | null;
  isMerged?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface EventSessionRecord {
  id: string;
  organizationId?: string;
  createdById?: string;
  name: string;
  mode: CaptureMode;
  eventType?: string | null;
  location?: string | null;
  startDate?: string;
  endDate?: string | null;
  status: string;
  scanCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedList<T> {
  items: T[];
  meta: { page: number; limit: number; total: number };
}

export interface OcrRelationshipMatch {
  id: string;
  matchedContactId: string;
  matchedContactName: string;
  matchedContactCompany: string | null;
  matchConfidence: number;
}

export interface ContactEncounterRecord {
  id: string;
  contactId: string;
  sessionId: string | null;
  captureMode: CaptureMode | null;
  encounterType: string | null;
  encounterLabel: string | null;
  leadQualifier: LeadQualifier | null;
  leadNote: string | null;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PendingCaptureRecord {
  id: string;
  clientIdempotencyKey: string;
  imageUri: string;
  fileName: string;
  mimeType: string;
  captureMode: CaptureMode;
  sessionId?: string;
  encounterType?: EncounterType;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export type EncounterType =
  | 'flight'
  | 'b2b'
  | 'airport'
  | 'dinner'
  | 'referral'
  | 'hallway'
  | 'other';

export type ExportStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'expired';

export interface SessionMemberRecord {
  userId: string;
  fullName: string | null;
  email: string;
  joinedAt: string;
}

export interface SessionStatsRecord {
  sessionId: string;
  scanCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  status: string;
}

export interface ExportJobRecord {
  id: string;
  exportType: string;
  status: ExportStatus;
  recordCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OcrJobRecord {
  id: string;
  cardImageId?: string;
  status: OcrStatus;
  extractedFields: Record<string, unknown>;
  /** API convenience — mirrors extractedFields.emails[0] */
  primaryEmail?: string | null;
  /** API convenience — mirrors extractedFields.phones[0] */
  primaryPhone?: string | null;
  confidenceScores: Record<string, number>;
  meanConfidence: number | null;
  rawText?: string | null;
  errorMessage?: string | null;
  matches: OcrRelationshipMatch[];
}
