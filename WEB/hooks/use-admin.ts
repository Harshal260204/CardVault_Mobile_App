'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import {
  createOrganization,
  createExportJob,
  deleteOrganization,
  deleteOrgUser,
  fetchAuditEvents,
  fetchDashboard,
  fetchExports,
  fetchOrganizations,
  fetchPlans,
  updateOrganization,
  updateOrgUser,
} from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { UserRole } from '@/lib/types';

export function useDashboard(params?: { period?: string }) {
  return useQuery({
    queryKey: params?.period
      ? [...queryKeys.admin.dashboard, params.period]
      : queryKeys.admin.dashboard,
    queryFn: () => fetchDashboard(api, params),
  });
}

export function useAuditEvents(params: {
  page: number;
  limit: number;
  q?: string;
  eventType?: string;
  entityType?: string;
}) {
  return useQuery({
    queryKey: queryKeys.admin.audit(params),
    queryFn: () => fetchAuditEvents(api, params),
  });
}

export function useExports(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: queryKeys.admin.exports(params),
    queryFn: () => fetchExports(api, params),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const active = items.some(
        (j) => j.status === 'pending' || j.status === 'processing',
      );
      return active ? 2000 : false;
    },
  });
}

export function useOrganizations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.organizations,
    queryFn: () => fetchOrganizations(api),
    enabled,
  });
}

export function usePlans(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.plans,
    queryFn: () => fetchPlans(api),
    enabled,
  });
}

export function useCreateExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      exportType: 'csv' | 'xlsx' | 'pdf';
      sessionId?: string;
      leadQualifier?: string;
      captureMode?: string;
    }) => createExportJob(api, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'exports'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useUpdateOrgUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      fullName?: string;
      role?: UserRole;
      isActive?: boolean;
    }) => updateOrgUser(api, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useDeleteOrgUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrgUser(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization.bind(null, api),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.organizations,
      });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      slug?: string;
      plan?: string;
      maxUsers?: number;
      storageQuotaGb?: number;
      isActive?: boolean;
    }) => updateOrganization(api, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.organizations,
      });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrganization(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.organizations,
      });
    },
  });
}
