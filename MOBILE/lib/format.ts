import type { CaptureMode, EncounterType, LeadQualifier } from '@/lib/types';

export function formatLeadLabel(
  qualifier: LeadQualifier | null | undefined,
): string {
  if (!qualifier) return 'Unqualified';
  return qualifier.charAt(0).toUpperCase() + qualifier.slice(1);
}

export function leadColor(qualifier: LeadQualifier | null | undefined): string {
  if (qualifier === 'hot') return '#DC2626';
  if (qualifier === 'warm') return '#F59E0B';
  if (qualifier === 'cold') return '#3B82F6';
  return '#94A3B8';
}

export function formatCaptureMode(
  mode: CaptureMode | null | undefined,
): string {
  const labels: Record<CaptureMode, string> = {
    visitor: 'Visitor',
    exhibitor: 'Exhibitor',
    quick_capture: 'Quick Capture',
    legacy: 'Legacy',
  };
  if (!mode) return 'Legacy';
  return labels[mode] ?? mode;
}

export function formatEncounterType(type: EncounterType): string {
  const labels: Record<EncounterType, string> = {
    flight: 'Flight',
    b2b: 'B2B Meeting',
    airport: 'Airport',
    dinner: 'Dinner',
    referral: 'Referral',
    hallway: 'Hallway',
    other: 'Other',
  };
  return labels[type] ?? type;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';

  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) {
    return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
