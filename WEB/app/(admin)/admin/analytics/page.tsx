'use client';

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  useEncounterTypeAnalytics,
  useLeadFunnelAnalytics,
  usePlatformAnalytics,
  useSessionAnalytics,
} from '@/hooks/use-analytics';
import { formatCaptureMode } from '@/lib/format';
import { isPlatformSuperAdmin } from '@/lib/roles';
import type { CaptureMode } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';

type SessionRow = {
  id: string;
  name: string;
  mode: string;
  status: string;
  scanCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
};

function ChartTooltip({
  active,
  payload,
  labelKey = 'name',
  valueLabel = 'Count',
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown>; value: number }>;
  labelKey?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-0 p-2.5 text-sm shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <p className="font-semibold text-text-primary">
        {String(d[labelKey] ?? '')}
      </p>
      <p className="text-text-secondary mt-0.5">
        {valueLabel}: {payload[0].value}
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = isPlatformSuperAdmin(user?.role);

  const funnel = useLeadFunnelAnalytics();
  const encounters = useEncounterTypeAnalytics();
  const sessions = useSessionAnalytics();
  const platform = usePlatformAnalytics(isSuperAdmin);

  const funnelData = funnel.data
    ? [
        { name: 'Hot', value: funnel.data.hot, fill: '#EF4444' },
        { name: 'Warm', value: funnel.data.warm, fill: '#F59E0B' },
        { name: 'Cold', value: funnel.data.cold, fill: '#3B82F6' },
        {
          name: 'Unqualified',
          value: funnel.data.unqualified,
          fill: '#94A3B8',
        },
      ]
    : [];

  const encounterData =
    encounters.data?.map((row) => ({
      name: row.encounterType ?? 'unknown',
      value: row.count,
    })) ?? [];

  const sessionColumns: DataTableColumn<SessionRow>[] = [
    { key: 'name', header: 'Session', render: (row) => row.name },
    {
      key: 'mode',
      header: 'Mode',
      render: (row) => formatCaptureMode(row.mode as CaptureMode),
    },
    { key: 'status', header: 'Status', render: (row) => row.status },
    { key: 'scans', header: 'Scans', render: (row) => row.scanCount },
    {
      key: 'leads',
      header: 'H / W / C',
      render: (row) => `${row.hotCount} / ${row.warmCount} / ${row.coldCount}`,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Lead funnel, encounter breakdown, and session performance"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Hot leads"
          value={funnel.data?.hot ?? 0}
          loading={funnel.isLoading}
        />
        <AdminStatCard
          label="Warm leads"
          value={funnel.data?.warm ?? 0}
          loading={funnel.isLoading}
        />
        <AdminStatCard
          label="Cold leads"
          value={funnel.data?.cold ?? 0}
          loading={funnel.isLoading}
        />
        <AdminStatCard
          label="Active sessions"
          value={
            sessions.data?.filter((s) => s.status === 'active').length ?? 0
          }
          loading={sessions.isLoading}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Lead funnel</CardTitle>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={funnelData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-text-tertiary"
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-text-tertiary"
                  />
                  <Tooltip content={<ChartTooltip valueLabel="Leads" />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <CardTitle className="mb-4">Encounter types</CardTitle>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={encounterData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-text-tertiary"
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-text-tertiary"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <CardTitle>Session performance</CardTitle>
          </div>
          <DataTable
            columns={sessionColumns}
            rows={sessions.data ?? []}
            keyField={(row) => row.id}
            isLoading={sessions.isLoading}
          />
        </CardContent>
      </Card>

      {isSuperAdmin ? (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Organizations"
              value={platform.data?.organizations ?? 0}
              loading={platform.isLoading}
            />
            <AdminStatCard
              label="Users"
              value={platform.data?.users ?? 0}
              loading={platform.isLoading}
            />
            <AdminStatCard
              label="Contacts"
              value={platform.data?.contacts ?? 0}
              loading={platform.isLoading}
            />
            <AdminStatCard
              label="OCR jobs"
              value={platform.data?.ocrJobs ?? 0}
              loading={platform.isLoading}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
