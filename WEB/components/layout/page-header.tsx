import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-heading-lg font-semibold text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-text-tertiary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
