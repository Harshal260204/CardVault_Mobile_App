import type { CaptureMode, LeadQualifier } from '@/lib/types';

const CAPTURE_LABELS: Record<CaptureMode, string> = {
  visitor: 'Visitor',
  exhibitor: 'Exhibitor',
  quick_capture: 'Quick Capture',
  legacy: 'Legacy',
};

export function formatCaptureMode(
  mode: CaptureMode | null | undefined,
): string {
  if (!mode) return 'Legacy';
  return CAPTURE_LABELS[mode] ?? mode;
}

export function leadBadgeVariant(
  qualifier: LeadQualifier | null | undefined,
): 'hot' | 'warm' | 'cold' | 'default' {
  if (qualifier === 'hot') return 'hot';
  if (qualifier === 'warm') return 'warm';
  if (qualifier === 'cold') return 'cold';
  return 'default';
}

export function formatLeadLabel(
  qualifier: LeadQualifier | null | undefined,
): string {
  if (!qualifier) return 'Unqualified';
  return qualifier.charAt(0).toUpperCase() + qualifier.slice(1);
}

/** e.g. "Jun 12, 2024" */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** e.g. "Jun 12, 2024 at 2:34 PM" */
export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${formatDate(d)} at ${d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}
