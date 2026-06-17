'use client';

import { api } from '@/lib/api';
import { closeSession, fetchSessions } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useSessionsList(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: queryKeys.sessions.list(params ?? {}),
    queryFn: () =>
      fetchSessions(api, {
        page: params?.page ?? 1,
        limit: params?.limit ?? 15,
        status: params?.status,
      }),
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeSession(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}
