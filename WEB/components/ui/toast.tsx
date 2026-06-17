'use client';

import { useToastStore } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-xs flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-modal animate-toast-in',
            toast.variant === 'error'
              ? 'bg-error-bg border border-error-border text-error-text'
              : 'bg-neutral-900 border border-neutral-700 text-white',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button
              type="button"
              className={cn(
                'text-xs font-medium opacity-70 hover:opacity-100 focus:outline-none',
                toast.variant === 'error'
                  ? 'text-error-text'
                  : 'text-neutral-400 hover:text-white',
              )}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
