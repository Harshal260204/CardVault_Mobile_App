'use client';

import { api } from '@/lib/api';
import {
  fetchEncounterTypeAnalytics,
  fetchLeadFunnel,
  fetchPlatformAnalytics,
  fetchSessionAnalytics,
} from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';

export function useLeadFunnelAnalytics(organizationId?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.funnel(organizationId),
    queryFn: () => fetchLeadFunnel(api, organizationId),
  });
}

export function useEncounterTypeAnalytics(organizationId?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.encounters(organizationId),
    queryFn: () => fetchEncounterTypeAnalytics(api, organizationId),
  });
}

export function useSessionAnalytics(organizationId?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.sessions(organizationId),
    queryFn: () => fetchSessionAnalytics(api, organizationId),
  });
}

export function usePlatformAnalytics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.platform,
    queryFn: () => fetchPlatformAnalytics(api),
    enabled,
  });
}
