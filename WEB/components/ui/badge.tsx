import { cn } from '@/lib/utils';

import type { HTMLAttributes } from 'react';

const variants = {
  default: 'bg-brand-50 text-brand-600 dark:bg-brand-50 dark:text-brand-600',
  accent: 'bg-brand-50 text-brand-600 dark:bg-brand-50 dark:text-brand-600',
  success: 'bg-success-bg text-success-text border border-success-border',
  warning: 'bg-warning-bg text-warning-text border border-warning-border',
  error: 'bg-error-bg text-error-text border border-error-border',
  hot: 'bg-[var(--color-qualifier-hot-bg)] text-[var(--color-qualifier-hot-text)] border border-[var(--color-qualifier-hot-border)]',
  warm: 'bg-[var(--color-qualifier-warm-bg)] text-[var(--color-qualifier-warm-text)] border border-[var(--color-qualifier-warm-border)]',
  cold: 'bg-[var(--color-qualifier-cold-bg)] text-[var(--color-qualifier-cold-text)] border border-[var(--color-qualifier-cold-border)]',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
