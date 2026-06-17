import { ListSkeleton } from '@/components/shared/list-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="flex items-start justify-between gap-4 px-4 py-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 py-4">
          <ListSkeleton rows={6} />
        </CardContent>
      </Card>
    </div>
  );
}
