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

export function useLeadFunnelAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.funnel(),
    queryFn: () => fetchLeadFunnel(api),
  });
}

export function useEncounterTypeAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.encounters(),
    queryFn: () => fetchEncounterTypeAnalytics(api),
  });
}

export function useSessionAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.sessions(),
    queryFn: () => fetchSessionAnalytics(api),
  });
}

export function usePlatformAnalytics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.platform,
    queryFn: () => fetchPlatformAnalytics(api),
    enabled,
  });
}
