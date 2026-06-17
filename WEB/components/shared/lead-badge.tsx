import { Badge } from '@/components/ui/badge';
import { formatLeadLabel, leadBadgeVariant } from '@/lib/format';
import type { LeadQualifier } from '@/lib/types';

export function LeadBadge({
  qualifier,
}: {
  qualifier: LeadQualifier | null | undefined;
}) {
  return (
    <Badge variant={leadBadgeVariant(qualifier)}>
      {formatLeadLabel(qualifier)}
    </Badge>
  );
}
