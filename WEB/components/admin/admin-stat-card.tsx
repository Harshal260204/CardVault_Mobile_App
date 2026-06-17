'use client';

import { CountUp } from '@/components/shared/count-up';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

interface AdminStatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  hint?: string;
  loading?: boolean;
  className?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  indicatorColor?: string; // e.g. "border-b-brand-600", "border-b-teal-500", etc.
  accentColor?: string; // CSS color value for bottom border accent
}

export function AdminStatCard({
  label,
  value,
  icon,
  hint,
  loading,
  className,
  trend,
  indicatorColor,
  accentColor,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-lg border border-neutral-200 bg-neutral-0 shadow-xs flex-1 min-w-[140px]',
        accentColor || indicatorColor ? 'border-b-2' : '',
        indicatorColor,
        className,
      )}
      style={accentColor ? { borderBottomColor: accentColor } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-text-tertiary h-4 w-4 shrink-0 flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
              {icon}
            </div>
          )}
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
            {label}
          </p>
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              trend.direction === 'up'
                ? 'bg-success-bg text-success-text'
                : 'bg-error-bg text-error-text',
            )}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <p className="text-[36px] font-bold leading-none mt-3 text-text-primary tracking-tight">
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <CountUp value={value} />
        )}
      </p>

      {hint && <p className="text-xs text-text-tertiary mt-1.5">{hint}</p>}
    </div>
  );
}
