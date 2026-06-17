'use client';

import {
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateExport, useExports } from '@/hooks/use-admin';
import { useContactsList } from '@/hooks/use-contacts';
import { useSessionsList } from '@/hooks/use-sessions';
import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/download';
import { formatCaptureMode } from '@/lib/format';
import type { CaptureMode, ExportJobRecord, LeadQualifier } from '@/lib/types';

export default function AdminExportPage() {
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [leadQualifier, setLeadQualifier] = useState<LeadQualifier | ''>('');
  const [captureMode, setCaptureMode] = useState<CaptureMode | ''>('');

  const limit = 10;
  const { data, isLoading } = useExports({ page, limit });
  const sessions = useSessionsList({ limit: 100 });
  const createExport = useCreateExport();

  // Record estimate query
  const contactsQuery = useContactsList({
    page: 1,
    limit: 1,
    sessionId: sessionId || undefined,
    leadQualifier: leadQualifier || undefined,
    mode: captureMode || undefined,
  });
  const estimatedRecords = contactsQuery.data?.meta.total ?? 0;

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  const handleExport = async (exportType: 'csv' | 'xlsx' | 'pdf') => {
    await createExport.mutateAsync({
      exportType,
      sessionId: sessionId || undefined,
      leadQualifier: leadQualifier || undefined,
      captureMode: captureMode || undefined,
    });
  };

  const handleDownload = async (row: ExportJobRecord) => {
    setDownloadingId(row.id);
    try {
      const ext =
        row.exportType === 'xlsx'
          ? 'xlsx'
          : row.exportType === 'pdf'
            ? 'pdf'
            : 'csv';
      await downloadBlob(
        api,
        `/exports/${row.id}/download`,
        `cardvault-export.${ext}`,
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRetry = async (job: ExportJobRecord) => {
    await createExport.mutateAsync({
      exportType: job.exportType as 'csv' | 'xlsx' | 'pdf',
      sessionId: job.sessionId || undefined,
    });
  };

  const columns: DataTableColumn<ExportJobRecord>[] = [
    {
      key: 'type',
      header: 'Type',
      className: 'w-[100px]',
      render: (row) => (
        <span className="font-medium uppercase text-foreground">
          {row.exportType}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[180px]',
      render: (row) => {
        if (row.status === 'processing' || row.status === 'pending') {
          return (
            <div className="space-y-1.5">
              <div className="text-xs text-text-secondary">Processing...</div>
              <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full animate-[progress_2s_ease-in-out_infinite]"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          );
        }
        if (row.status === 'ready') {
          return <Badge variant="success">Complete</Badge>;
        }
        if (row.status === 'failed') {
          return <Badge variant="error">Failed</Badge>;
        }
        return <Badge variant="default">{row.status}</Badge>;
      },
    },
    {
      key: 'records',
      header: 'Records',
      className: 'w-[120px]',
      render: (row) => (
        <span className="text-text-secondary">{row.recordCount ?? '—'}</span>
      ),
    },
    {
      key: 'created',
      header: 'Requested',
      className: 'min-w-[180px]',
      render: (row) => (
        <span className="text-text-secondary">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'download',
      header: '',
      className: 'w-[140px] text-right',
      render: (job) => (
        <div className="flex items-center justify-end gap-2">
          {job.status === 'ready' && (
            <Button
              variant="ghost"
              size="sm"
              loading={downloadingId === job.id}
              onClick={() => handleDownload(job)}
            >
              Download
            </Button>
          )}
          {job.status === 'failed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRetry(job)}
              loading={createExport.isPending}
            >
              Retry
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Export Center"
        description="Bulk export contacts as CSV, Excel, or PDF summary"
      />

      <Card>
        <CardHeader>
          <CardTitle>Request export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <label className="text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Session
              </span>
              <select
                className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 text-foreground px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-600/20"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                <option value="">All sessions</option>
                {(sessions.data?.items ?? []).map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Lead qualifier
              </span>
              <select
                className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 text-foreground px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-600/20"
                value={leadQualifier}
                onChange={(e) =>
                  setLeadQualifier(e.target.value as LeadQualifier | '')
                }
              >
                <option value="">All leads</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Capture mode
              </span>
              <select
                className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 text-foreground px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-600/20"
                value={captureMode}
                onChange={(e) =>
                  setCaptureMode(e.target.value as CaptureMode | '')
                }
              >
                <option value="">All modes</option>
                <option value="visitor">{formatCaptureMode('visitor')}</option>
                <option value="exhibitor">
                  {formatCaptureMode('exhibitor')}
                </option>
                <option value="quick_capture">
                  {formatCaptureMode('quick_capture')}
                </option>
              </select>
            </label>
            <div className="text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Date Range
              </span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Future: Date range picker"
                  disabled
                  className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-text-tertiary pl-9 pr-3 text-sm outline-none cursor-not-allowed"
                />
                <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              </div>
            </div>
          </div>

          <p className="text-sm text-text-tertiary mb-5">
            Estimated records:{' '}
            <span className="font-semibold text-text-primary">
              {contactsQuery.isLoading ? 'Calculating...' : estimatedRecords}
            </span>
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => handleExport('xlsx')}
              loading={createExport.isPending}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => handleExport('csv')}
              loading={createExport.isPending}
            >
              <FileText className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => handleExport('pdf')}
              loading={createExport.isPending}
            >
              <FileDown className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            keyField={(r) => r.id}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={Download}
                title="No export jobs yet"
                description="Export your contacts list in CSV, Excel, or PDF format using the buttons above."
              />
            }
          />
          {!isLoading && data?.items && data.items.length > 0 && (
            <div className="px-4 py-3 border-t border-border/40">
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
    </div>
  );
}
