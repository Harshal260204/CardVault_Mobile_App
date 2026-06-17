'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import {
  createContact,
  deleteContact,
  fetchContact,
  fetchContacts,
  mergeContacts,
  updateContact,
} from '@/lib/api-client';
import type { CreateContactPayload } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ContactSearchParams } from '@/lib/validation';

export function useContactsList(params: ContactSearchParams) {
  return useQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: () => fetchContacts(api, params),
  });
}

export function useContact(id: string | null) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id ?? ''),
    queryFn: () => fetchContact(api, id!),
    enabled: Boolean(id),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContactPayload) => createContact(api, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });
}

export function useUpdateContact(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateContactPayload>) =>
      updateContact(api, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContact(api, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useMergeContacts(targetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceContactId: string) =>
      mergeContacts(api, targetId, sourceContactId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.detail(targetId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}
