import { api } from '@/lib/api';
import { fetchOrgUsers } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useOrgUsers(params: {
  page: number;
  limit: number;
  q?: string;
  role?: string;
  organizationId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => fetchOrgUsers(api, params),
  });
}

export function useCreateOrgUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      fullName: string;
      role: string;
      password?: string;
      organizationId?: string;
    }) => {
      const res = await api.post('/users', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}
