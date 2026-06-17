import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <Skeleton className="h-14 w-14 rounded-2xl" />
        </div>
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-7 w-40" />
          <Skeleton className="mx-auto h-4 w-56" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="mx-auto h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
