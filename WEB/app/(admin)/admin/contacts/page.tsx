'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { LeadBadge } from '@/components/shared/lead-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/modal';
import { useContactsList, useDeleteContact } from '@/hooks/use-contacts';
import { api } from '@/lib/api';
import { updateContact } from '@/lib/api-client';
import { formatCaptureMode } from '@/lib/format';
import { queryKeys } from '@/lib/query-keys';
import type {
  ContactRecord,
  PaginatedList,
  CaptureMode,
  LeadQualifier,
} from '@/lib/types';

const getInitials = (name: string | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const formatCapturedDate = (dateString: string) => {
  const d = new Date(dateString);
  const now = new Date();
  const optionsShort: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  const optionsLong: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, optionsShort);
  }
  return d.toLocaleDateString(undefined, optionsLong);
};

const getNextQualifier = (
  current: LeadQualifier | null | undefined,
): LeadQualifier | null => {
  if (!current) return 'hot';
  if (current === 'hot') return 'warm';
  if (current === 'warm') return 'cold';
  return null;
};

export default function AdminContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [mode, setMode] = useState<CaptureMode | undefined>();
  const [qualifier, setQualifier] = useState<LeadQualifier | undefined>();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [deletingContact, setDeletingContact] = useState<ContactRecord | null>(
    null,
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const limit = 15;
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useContactsList({
    page,
    limit,
    q: debouncedQ || undefined,
    mode,
    leadQualifier: qualifier,
  });

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  // Optimistic update qualifier mutation
  const updateQualifierMutation = useMutation({
    mutationFn: ({
      id,
      leadQualifier,
    }: {
      id: string;
      leadQualifier: LeadQualifier | null;
    }) => updateContact(api, id, { leadQualifier }),
    onMutate: async ({ id, leadQualifier }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });
      const previousContacts = queryClient.getQueryData<
        PaginatedList<ContactRecord>
      >(
        queryKeys.contacts.list({
          page,
          limit,
          q: debouncedQ || undefined,
          mode,
          leadQualifier: qualifier,
        }),
      );
      queryClient.setQueryData(
        queryKeys.contacts.list({
          page,
          limit,
          q: debouncedQ || undefined,
          mode,
          leadQualifier: qualifier,
        }),
        (old: PaginatedList<ContactRecord> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item: ContactRecord) =>
              item.id === id ? { ...item, leadQualifier } : item,
            ),
          };
        },
      );
      return { previousContacts };
    },
    onError: (
      err,
      variables,
      context:
        | { previousContacts: PaginatedList<ContactRecord> | undefined }
        | undefined,
    ) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(
          queryKeys.contacts.list({
            page,
            limit,
            q: debouncedQ || undefined,
            mode,
            leadQualifier: qualifier,
          }),
          context.previousContacts,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });

  const deleteContactMutation = useDeleteContact();

  const handleDeleteContactConfirm = async () => {
    if (!deletingContact) return;
    try {
      await deleteContactMutation.mutateAsync(deletingContact.id);
      setDeletingContact(null);
    } catch {}
  };

  const handleBulkQualify = async () => {
    for (const id of selectedIds) {
      await updateQualifierMutation.mutateAsync({ id, leadQualifier: 'hot' });
    }
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteContactMutation.mutateAsync(id);
    }
    setSelectedIds([]);
    setBulkDeleteOpen(false);
  };

  const columns: DataTableColumn<ContactRecord>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={
            data?.items?.length
              ? selectedIds.length === data.items.length
              : false
          }
          onChange={(e) => {
            if (e.target.checked && data?.items) {
              setSelectedIds(data.items.map((r) => r.id));
            } else {
              setSelectedIds([]);
            }
          }}
          className="rounded border-neutral-300 dark:border-neutral-800 text-brand-600 focus:ring-brand-500 h-4 w-4 bg-neutral-0 dark:bg-neutral-900 cursor-pointer"
        />
      ),
      className: 'w-[40px]',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds((prev) => [...prev, row.id]);
            } else {
              setSelectedIds((prev) => prev.filter((id) => id !== row.id));
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-neutral-300 dark:border-neutral-800 text-brand-600 focus:ring-brand-500 h-4 w-4 bg-neutral-0 dark:bg-neutral-900 cursor-pointer"
        />
      ),
    },
    {
      key: 'name',
      header: 'Contact',
      className: 'min-w-[200px]',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
            {getInitials(row.fullName)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {row.fullName}
            </p>
            <p className="text-xs text-text-tertiary truncate">
              {row.company ?? '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'mode',
      header: 'Mode',
      className: 'w-[125px]',
      render: (row) => (
        <Badge variant="accent">{formatCaptureMode(row.captureMode)}</Badge>
      ),
    },
    {
      key: 'lead',
      header: 'Lead',
      className: 'w-[125px]',
      render: (row) => {
        const next = getNextQualifier(row.leadQualifier);
        const handleBadgeClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          updateQualifierMutation.mutate({ id: row.id, leadQualifier: next });
        };
        return (
          <button
            onClick={handleBadgeClick}
            type="button"
            className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none select-none"
            title="Click to cycle lead qualification"
          >
            <LeadBadge qualifier={row.leadQualifier} />
          </button>
        );
      },
    },
    {
      key: 'email',
      header: 'Email',
      className: 'min-w-[180px]',
      render: (row) => (
        <span className="text-text-secondary">{row.emails[0] ?? '—'}</span>
      ),
    },
    {
      key: 'captured',
      header: 'Captured',
      className: 'w-[120px]',
      render: (row) => (
        <span className="text-xs text-text-tertiary">
          {formatCapturedDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px] text-right',
      render: (row) => {
        const isDropdownOpen = activeDropdownId === row.id;
        return (
          <div className="flex justify-end gap-2 items-center">
            <Link
              href={`/admin/contacts/${row.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                title="View contact details"
              >
                View
              </Button>
            </Link>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdownId(isDropdownOpen ? null : row.id);
                }}
                className="h-7 w-7 flex items-center justify-center text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-border/40 focus:outline-none"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveDropdownId(null)}
                  />
                  <div className="absolute right-0 mt-1 w-36 rounded-md border border-neutral-200 dark:border-neutral-800 bg-surface shadow-lg py-1 z-50 text-left">
                    <Link href={`/admin/contacts/${row.id}`}>
                      <button
                        className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        onClick={() => setActiveDropdownId(null)}
                      >
                        Edit
                      </button>
                    </Link>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(null);
                        setDeletingContact(row);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-655 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const hasActiveFilters = Boolean(debouncedQ || mode || qualifier);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, data?.meta.total ?? 0);
  const total = data?.meta.total ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contacts"
        description={
          data
            ? `${data.meta.total} contacts in your organization`
            : 'Org-wide directory'
        }
      />

      {/* FILTER BAR REDESIGN */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-200 dark:border-neutral-800 rounded-md bg-neutral-0 dark:bg-neutral-900 text-foreground focus:border-brand-600 focus:ring-1 focus:ring-brand-600/20 outline-none transition-colors"
          />
        </div>
        <select
          value={mode || ''}
          onChange={(e) => {
            setMode(
              e.target.value ? (e.target.value as CaptureMode) : undefined,
            );
            setPage(1);
          }}
          className="h-9 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 text-foreground rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-brand-600/20 cursor-pointer"
        >
          <option value="">All modes</option>
          <option value="visitor">Visitor</option>
          <option value="exhibitor">Exhibitor</option>
          <option value="quick_capture">Quick</option>
        </select>
        <select
          value={qualifier || ''}
          onChange={(e) => {
            setQualifier(
              e.target.value ? (e.target.value as LeadQualifier) : undefined,
            );
            setPage(1);
          }}
          className="h-9 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 text-foreground rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-brand-600/20 cursor-pointer"
        >
          <option value="">All qualifiers</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
          <option value="unqualified">Unqualified</option>
        </select>
        <button
          type="button"
          className="h-9 w-9 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 rounded-md text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          title="Advanced filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* ACTIVE FILTER CHIPS */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 mb-4 items-center">
          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 rounded-full">
              Search: {search}
              <button
                onClick={() => setSearch('')}
                type="button"
                className="hover:opacity-75 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {mode && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 rounded-full">
              Mode: {formatCaptureMode(mode)}
              <button
                onClick={() => setMode(undefined)}
                type="button"
                className="hover:opacity-75 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {qualifier && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 rounded-full">
              Qualifier: {qualifier.toUpperCase()}
              <button
                onClick={() => setQualifier(undefined)}
                type="button"
                className="hover:opacity-75 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSearch('');
              setMode(undefined);
              setQualifier(undefined);
            }}
            type="button"
            className="text-xs text-text-tertiary hover:text-text-primary hover:underline px-2 focus:outline-none"
          >
            Clear all
          </button>
        </div>
      )}

      {/* DATA TABLE CARD */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            keyField={(r) => r.id}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={UsersIcon}
                title="No contacts found"
                description={
                  debouncedQ || mode || qualifier
                    ? 'Try adjusting your search queries or capture mode filters.'
                    : 'Contacts will appear here once cards are scanned on the mobile application.'
                }
              />
            }
          />
          {!isLoading && data?.items && data.items.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3 border-t border-border/40">
              <span className="text-sm text-text-tertiary">
                Showing {start}–{end} of {total} contacts
              </span>
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={data?.meta.total ?? 0}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-4 border border-white/10 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={() => {
              alert(`Exporting ${selectedIds.length} contacts...`);
              setSelectedIds([]);
            }}
            className="text-sm text-white hover:text-brand-300 transition-colors focus:outline-none font-medium"
          >
            Export
          </button>
          <button
            onClick={handleBulkQualify}
            className="text-sm text-white hover:text-brand-300 transition-colors focus:outline-none font-medium"
          >
            Qualify as Hot
          </button>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            className="text-sm text-red-400 hover:text-red-300 transition-colors focus:outline-none font-medium"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-2 text-white/50 hover:text-white transition-colors focus:outline-none"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={!!deletingContact}
        onCancel={() => setDeletingContact(null)}
        onConfirm={handleDeleteContactConfirm}
        title="Delete Contact"
        message={
          deletingContact
            ? `Are you sure you want to permanently delete contact "${deletingContact.fullName}"? This action cannot be undone.`
            : ''
        }
        loading={deleteContactMutation.isPending}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete selected contacts"
        message={`Permanently delete ${selectedIds.length} selected contact${selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmLabel="Delete all"
        loading={deleteContactMutation.isPending}
      />
    </div>
  );
}
