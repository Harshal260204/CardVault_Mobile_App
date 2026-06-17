'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import { EmptyState } from '@/components/shared/empty-state';

type AdminRouteError = Error & {
  digest?: string;
};

export default function AdminError({
  error,
  reset,
}: {
  error: AdminRouteError;
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.error('[admin] route error:', error);
  }, [error]);

  return (
    <div className="space-y-4 py-8">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description={
          isDev
            ? error.message ||
              'An unexpected error occurred in the admin console.'
            : 'We could not load this page. Please try again, or contact support if the problem persists.'
        }
        actionLabel="Try again"
        onAction={reset}
      />

      {!isDev && error.digest ? (
        <p className="text-center text-xs text-text-tertiary">
          Reference ID: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}

      {isDev ? (
        <pre className="mx-auto max-w-3xl overflow-x-auto rounded-lg border border-border bg-zinc-50 p-4 text-left text-xs text-red-700 dark:bg-zinc-900/50">
          {error.stack ?? error.message}
        </pre>
      ) : null}
    </div>
  );
}
