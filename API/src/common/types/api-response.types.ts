export interface ApiErrorPayload {
  code: string;
  message: string;
  field?: string;
  correlationId?: string;
}

export interface ApiMetaPayload {
  page?: number;
  limit?: number;
  total?: number;
  cursor?: string | null;
  correlationId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
