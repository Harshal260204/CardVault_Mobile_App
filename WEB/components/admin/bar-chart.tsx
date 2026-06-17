'use client';

import { cn } from '@/lib/utils';

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  className?: string;
}

export function BarChart({ data, className }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('flex items-end justify-between gap-2', className)}>
      {data.map((item) => (
        <div
          key={item.label}
          className="flex flex-1 flex-col items-center gap-2"
        >
          <div className="flex h-32 w-full items-end justify-center">
            <div
              className={cn(
                'w-full max-w-[48px] rounded-t-md transition-all',
                item.color ?? 'bg-brand-600',
              )}
              style={{ height: `${Math.max((item.value / max) * 100, 4)}%` }}
              title={`${item.value}`}
            />
          </div>
          <span className="text-center text-[10px] font-medium text-text-tertiary">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
