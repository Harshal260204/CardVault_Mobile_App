'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import { EmptyState } from '@/components/shared/empty-state';

type AuthRouteError = Error & {
  digest?: string;
};

export default function AuthError({
  error,
  reset,
}: {
  error: AuthRouteError;
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.error('[auth] route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <EmptyState
          icon={AlertTriangle}
          title="Sign-in unavailable"
          description={
            isDev
              ? error.message ||
                'An unexpected error occurred on the sign-in page.'
              : 'We could not load the sign-in page. Please try again.'
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
          <pre className="overflow-x-auto rounded-lg border border-border bg-zinc-50 p-4 text-left text-xs text-red-700 dark:bg-zinc-900/50">
            {error.stack ?? error.message}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
