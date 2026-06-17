'use client';

import { api } from '@/lib/api';
import {
  createBillingCheckout,
  createBillingPortal,
  fetchBillingSubscription,
} from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useBillingSubscription() {
  return useQuery({
    queryKey: queryKeys.billing.subscription,
    queryFn: () => fetchBillingSubscription(api),
  });
}

export function useBillingCheckout() {
  return useMutation({
    mutationFn: () => createBillingCheckout(api, 'pro'),
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: () => createBillingPortal(api),
  });
}
