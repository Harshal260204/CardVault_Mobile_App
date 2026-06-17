'use client';

import {
  Activity,
  Contact,
  Download,
  Flame,
  Users,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  AreaChart,
  Area,
  Cell,
} from 'recharts';

import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/use-admin';
import { useSessionsList } from '@/hooks/use-sessions';
import { formatCaptureMode, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('7');
  const { data, isLoading, isError } = useDashboard({ period: `${period}d` });
  const sessions = useSessionsList({ limit: 100 });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Dashboard" description="Loading analytics…" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <PageHeader
        title="Dashboard"
        description="Could not load dashboard. Ensure you are signed in as manager or super admin."
      />
    );
  }

  const leadChartData = [
    { name: 'Hot', value: data.leads.hot, fill: '#EF4444' },
    { name: 'Warm', value: data.leads.warm, fill: '#F59E0B' },
    { name: 'Cold', value: data.leads.cold, fill: '#3B82F6' },
    { name: 'Unqualified', value: data.leads.unqualified, fill: '#94A3B8' },
  ];

  const captureChart = Object.entries(data.captureModes).map(
    ([mode, value]) => ({
      label: formatCaptureMode(mode as 'visitor').slice(0, 3),
      value,
    }),
  );

  const timelineData = data.capturesByDay.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }));

  const topSessions = [...(sessions.data?.items ?? [])]
    .sort((a, b) => b.scanCount - a.scanCount)
    .slice(0, 5);

  const formatEventAction = (type: string) => {
    const parts = type.split('.');
    if (parts.length === 2) {
      return parts[1];
    }
    return type.toLowerCase();
  };

  const getEventBorderClass = (type: string) => {
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="KPIs, capture timeline, and lead funnel"
        action={
          <div className="relative inline-flex items-center">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as '7' | '30' | '90')}
              className="appearance-none bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-text-secondary hover:text-text-primary pl-3 pr-8 py-1.5 border border-border/80 rounded-lg focus:outline-none cursor-pointer font-medium"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <ChevronDown className="absolute right-2.5 h-4 w-4 pointer-events-none text-text-tertiary" />
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Contacts"
          value={data.totals.contacts}
          icon={<Contact />}
          indicatorColor="border-b-brand-600"
          trend={{ value: 12, direction: 'up' }}
        />
        <AdminStatCard
          label="Users"
          value={data.totals.users}
          icon={<Users />}
          indicatorColor="border-b-teal-500"
          trend={{ value: 5, direction: 'up' }}
        />
        <AdminStatCard
          label="Active sessions"
          value={data.totals.activeSessions}
          icon={<Activity />}
          indicatorColor="border-b-amber-500"
          trend={{ value: 8, direction: 'down' }}
        />
        <AdminStatCard
          label="Exports"
          value={data.totals.exports}
          icon={<Download />}
          indicatorColor="border-b-blue-500"
          trend={{ value: 24, direction: 'up' }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <CardTitle className="mb-4 flex items-center gap-2">
              <Flame className="h-4 w-4 text-qualifier-hot" />
              Lead funnel
            </CardTitle>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={leadChartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-text-secondary"
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-text-secondary"
                  />
                  <Tooltip
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-neutral-0 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-xs shadow-md">
                            <p className="font-semibold text-text-primary dark:text-neutral-100">
                              {d.name}
                            </p>
                            <p className="text-text-secondary dark:text-neutral-400 mt-0.5">
                              Leads: {d.value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {leadChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      fontSize={11}
                      className="fill-text-secondary"
                    />
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <CardTitle className="mb-4">Captures ({period} days)</CardTitle>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-neutral-0 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-xs shadow-md">
                            <p className="font-semibold text-text-primary dark:text-neutral-100">
                              {d.date}
                            </p>
                            <p className="text-text-secondary dark:text-neutral-400 mt-0.5">
                              Captures: {d.count}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* By Capture Mode Chart */}
        {captureChart.length > 0 ? (
          <Card className="hidden lg:block">
            <CardContent>
              <CardTitle className="mb-4">By capture mode</CardTitle>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart
                    data={captureChart}
                    margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="label"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      className="fill-text-secondary"
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      className="fill-text-secondary"
                    />
                    <Tooltip
                      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-neutral-0 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-xs shadow-md">
                              <p className="font-semibold text-text-primary dark:text-neutral-100">
                                {d.label}
                              </p>
                              <p className="text-text-secondary dark:text-neutral-400 mt-0.5">
                                Captures: {d.value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        fontSize={11}
                        className="fill-text-secondary"
                      />
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Top Sessions Table Card */}
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-base">
              Top Sessions This Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    <th className="py-2">Session name</th>
                    <th className="py-2 text-right">Scans</th>
                    <th className="py-2 text-right">Hot leads</th>
                    <th className="py-2 text-right">Conv. rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topSessions.length ? (
                    topSessions.map((session) => {
                      const convRate =
                        session.scanCount > 0
                          ? Math.round(
                              ((session.hotCount + session.warmCount) /
                                session.scanCount) *
                                100,
                            )
                          : 0;
                      return (
                        <tr
                          key={session.id}
                          className="text-text-secondary hover:bg-neutral-50/50 dark:hover:bg-neutral-850/50"
                        >
                          <td
                            className="py-2.5 font-medium text-foreground truncate max-w-[150px]"
                            title={session.name}
                          >
                            {session.name}
                          </td>
                          <td className="py-2.5 text-right">
                            {session.scanCount}
                          </td>
                          <td className="py-2.5 text-right">
                            {session.hotCount}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-success">
                            {convRate}%
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-xs text-text-tertiary"
                      >
                        No active sessions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <Link
            href="/admin/audit-log"
            className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            View all activity →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {data.recentActivity.length ? (
              data.recentActivity.slice(0, 8).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                >
                  <div
                    className={cn(
                      'w-1 h-8 rounded-full shrink-0',
                      getEventBorderClass(event.eventType),
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary dark:text-neutral-100 truncate">
                      <span className="font-semibold text-foreground">
                        {event.actorEmail ?? 'System'}
                      </span>{' '}
                      <span className="text-text-secondary dark:text-neutral-400">
                        {formatEventAction(event.eventType)}
                      </span>{' '}
                      <span className="font-semibold text-foreground">
                        {event.entityType}
                      </span>
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-text-tertiary">
                No recent activity recorded
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
