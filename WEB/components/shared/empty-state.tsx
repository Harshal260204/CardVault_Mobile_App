import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/30 dark:bg-neutral-900/10 max-w-md mx-auto my-8 transition-colors',
        className,
      )}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-text-secondary mb-4"
        aria-hidden="true"
      >
        <Icon className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h3 className="text-[15px] font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-[300px] mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="font-medium">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
