'use client';

import { Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';

import { PaginationBar } from '@/components/admin/pagination-bar';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditEvents } from '@/hooks/use-admin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';

const formatLongDate = (dateString: string) => {
  const d = new Date(dateString);
  return (
    d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' at ' +
    d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  );
};

const getEventColorClass = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('create') || t.includes('add')) return 'bg-success';
  if (t.includes('delete') || t.includes('archive') || t.includes('remove'))
    return 'bg-error';
  if (
    t.includes('update') ||
    t.includes('edit') ||
    t.includes('patch') ||
    t.includes('close')
  )
    return 'bg-warning';
  if (t.includes('auth') || t.includes('login') || t.includes('logout'))
    return 'bg-brand-600';
  return 'bg-neutral-400';
};

const getBadgeVariant = (
  type: string,
): 'success' | 'error' | 'warning' | 'accent' | 'default' => {
  const t = type.toLowerCase();
  if (t.includes('create') || t.includes('add')) return 'success';
  if (t.includes('delete') || t.includes('archive') || t.includes('remove'))
    return 'error';
  if (
    t.includes('update') ||
    t.includes('edit') ||
    t.includes('patch') ||
    t.includes('close')
  )
    return 'warning';
  if (t.includes('auth') || t.includes('login') || t.includes('logout'))
    return 'accent';
  return 'default';
};

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const debouncedQ = useDebouncedValue(search.trim(), 300);
  const limit = 20;
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, eventType, fromDate, toDate]);

  const { data, isLoading } = useAuditEvents({
    page,
    limit,
    q: debouncedQ || undefined,
    eventType: eventType || undefined,
  });

  const toggleRow = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  // local filter for dates if fromDate / toDate is selected
  const filteredItems = (data?.items ?? []).filter((item) => {
    const time = new Date(item.createdAt).getTime();
    if (fromDate) {
      const start = new Date(fromDate).getTime();
      if (time < start) return false;
    }
    if (toDate) {
      const end = new Date(toDate).getTime() + 86400000; // include full toDate
      if (time > end) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Log"
        description={
          data
            ? `${data.meta.total} immutable compliance events`
            : 'Immutable compliance event browser'
        }
      />

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <input
          type="text"
          placeholder="Search event or entity type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] h-9 text-sm border border-neutral-200 dark:border-neutral-800 rounded-md px-3 bg-neutral-0 dark:bg-neutral-900 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-600/20"
        />

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="h-9 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 text-foreground rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-brand-600/20 cursor-pointer"
        >
          <option value="">All events</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="auth">Auth</option>
          <option value="system">System</option>
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            placeholder="From"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm px-3 bg-neutral-0 dark:bg-neutral-900 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-600/20"
            title="Start date"
          />
          <span className="text-xs text-text-tertiary">to</span>
          <input
            type="date"
            placeholder="To"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm px-3 bg-neutral-0 dark:bg-neutral-900 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-600/20"
            title="End date"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-tertiary bg-zinc-50 dark:bg-zinc-900/50">
                  <th className="w-2 px-1"></th>
                  <th className="px-4 py-2.5 font-semibold">Event</th>
                  <th className="px-4 py-2.5 font-semibold">Actor</th>
                  <th className="px-4 py-2.5 font-semibold">Entity ID</th>
                  <th className="px-4 py-2.5 font-semibold">When</th>
                  <th className="w-10 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, rowIndex) => (
                    <tr
                      key={`skeleton-row-${rowIndex}`}
                      className="h-14 border-b border-border/40 animate-pulse"
                    >
                      <td className="w-2 px-1"></td>
                      <td className="px-4 py-2 align-middle">
                        <Skeleton className="h-3.5 w-32" />
                      </td>
                      <td className="px-4 py-2 align-middle">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-16 mt-1" />
                      </td>
                      <td className="px-4 py-2 align-middle">
                        <Skeleton className="h-3.5 w-20 font-mono" />
                      </td>
                      <td className="px-4 py-2 align-middle">
                        <Skeleton className="h-3.5 w-36" />
                      </td>
                      <td className="w-10 px-4 py-2"></td>
                    </tr>
                  ))
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((row) => {
                    const isExpanded = expandedIds.includes(row.id);
                    const borderClass = getEventColorClass(row.eventType);
                    return (
                      <Suspense
                        key={row.id}
                        fallback={
                          <tr>
                            <td colSpan={6}>Loading row...</td>
                          </tr>
                        }
                      >
                        <tr className="h-14 border-b border-border/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="w-2 px-1 align-middle">
                            <div
                              className={cn(
                                'w-1 h-8 rounded-full',
                                borderClass,
                              )}
                            />
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <Badge variant={getBadgeVariant(row.eventType)}>
                              {row.eventType}
                            </Badge>
                            <p className="text-xs text-text-tertiary mt-1 font-medium">
                              {row.entityType}
                            </p>
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <p className="text-sm font-medium text-text-primary dark:text-neutral-100">
                              {row.actorEmail ?? 'System'}
                            </p>
                            {row.actorRole ? (
                              <Badge
                                variant="default"
                                className="text-[10px] mt-0.5 px-1.5 py-0.5"
                              >
                                {row.actorRole}
                              </Badge>
                            ) : null}
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <span
                              className="font-mono text-xs text-text-tertiary cursor-help"
                              title={row.entityId || ''}
                            >
                              {row.entityId
                                ? row.entityId.length > 12
                                  ? `${row.entityId.slice(0, 12)}...`
                                  : row.entityId
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle text-text-tertiary text-xs whitespace-nowrap">
                            {formatLongDate(row.createdAt)}
                          </td>
                          <td className="w-10 px-4 py-2 align-middle text-right">
                            <button
                              onClick={() => toggleRow(row.id)}
                              type="button"
                              className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none"
                              title={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-neutral-50/60 dark:bg-neutral-900/30">
                            <td
                              colSpan={6}
                              className="px-6 py-3 border-b border-border/40"
                            >
                              <div className="text-xs text-text-secondary dark:text-neutral-400">
                                <span>Full Entity ID: </span>
                                <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[11px] mr-4">
                                  {row.entityId || '—'}
                                </span>
                                <span className="text-text-tertiary mr-4">
                                  |
                                </span>
                                <span>IP: </span>
                                <span className="font-mono mr-4">
                                  {(row.eventData?.ip as string) || '127.0.0.1'}
                                </span>
                                <span className="text-text-tertiary mr-4">
                                  |
                                </span>
                                <span>User Agent: </span>
                                <span className="text-text-tertiary font-mono text-[11px] truncate inline-block max-w-[300px] align-bottom">
                                  {(row.eventData?.userAgent as string) ||
                                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Suspense>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6">
                      <EmptyState
                        icon={Shield}
                        title="No compliance events found"
                        description={
                          debouncedQ
                            ? 'Try adjusting your search queries.'
                            : 'Compliance activity will appear here once actions are performed on the console.'
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
