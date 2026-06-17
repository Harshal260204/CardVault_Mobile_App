import { cn } from '@/lib/utils';

import type { HTMLAttributes } from 'react';

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'shimmer rounded-md bg-zinc-100 dark:bg-zinc-800',
        className,
      )}
      {...props}
    />
  );
}
