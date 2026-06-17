'use client';

import { api } from '@/lib/api';
import { fetchMe } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';

export function useAuthProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => fetchMe(api),
    enabled,
    staleTime: 60_000,
  });
}
