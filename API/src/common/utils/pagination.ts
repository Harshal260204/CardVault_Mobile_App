import type { PaginatedResult } from '../types/api-response.types';

export function resolvePagination(
  page = 1,
  limit = 20,
): {
  page: number;
  limit: number;
  skip: number;
  take: number;
} {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return { items, total, page, limit };
}
