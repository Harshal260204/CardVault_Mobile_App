'use client';

import { CalendarDays } from 'lucide-react';
import { useState } from 'react';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCloseSession, useSessionsList } from '@/hooks/use-sessions';
import { formatCaptureMode } from '@/lib/format';
import type { EventSessionRecord } from '@/lib/types';

function statusVariant(
  status: string,
): 'default' | 'accent' | 'success' | 'warning' {
  if (status === 'active') return 'success';
  if (status === 'closed') return 'warning';
  return 'default';
}

export default function AdminSessionsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const limit = 15;
  const { data, isLoading } = useSessionsList({
    page,
    limit,
    status: statusFilter,
  });
  const closeSession = useCloseSession();

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  const columns: DataTableColumn<EventSessionRecord>[] = [
    {
      key: 'name',
      header: 'Session',
      className: 'min-w-[200px]',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-text-tertiary">
            {row.location ?? 'No location'}
          </p>
        </div>
      ),
    },
    {
      key: 'mode',
      header: 'Mode',
      className: 'w-[140px]',
      render: (row) => (
        <Badge variant="accent">{formatCaptureMode(row.mode)}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[120px]',
      render: (row) => (
        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      key: 'scans',
      header: 'Scans',
      className: 'w-[90px]',
      render: (row) => <span className="font-medium">{row.scanCount}</span>,
    },
    {
      key: 'leads',
      header: 'H / W / C',
      className: 'w-[120px]',
      render: (row) => (
        <span className="text-text-secondary">
          {row.hotCount} / {row.warmCount} / {row.coldCount}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      className: 'min-w-[160px]',
      render: (row) => (
        <span className="text-sm text-text-secondary">
          {row.startDate}
          {row.endDate ? ` → ${row.endDate}` : ''}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px] text-right',
      render: (row) =>
        row.status === 'active' ? (
          <Button
            variant="ghost"
            size="sm"
            loading={closeSession.isPending}
            onClick={() => closeSession.mutate(row.id)}
          >
            Close
          </Button>
        ) : (
          <span className="text-xs text-text-tertiary">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Event sessions"
        description={
          data
            ? `${data.meta.total} sessions in your organization`
            : 'Org-wide session directory'
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'All', value: undefined },
          { label: 'Active', value: 'active' },
          { label: 'Closed', value: 'closed' },
        ].map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
            className={`rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
              statusFilter === filter.value
                ? 'border-brand-600/20 bg-brand-50 text-brand-600'
                : 'border-neutral-200 bg-neutral-0 text-text-secondary hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            keyField={(r) => r.id}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={CalendarDays}
                title="No sessions found"
                description="Sessions are created by field reps on the mobile app."
              />
            }
          />
          {!isLoading && data?.items && data.items.length > 0 && (
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
