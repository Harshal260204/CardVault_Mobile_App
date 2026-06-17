import type { TenantStore } from './tenant-context.storage';
import type { RequestUser } from '../../modules/auth/auth.types';
import type { UserRole } from '@prisma/client';

export enum TenantScopingMode {
  StrictTenant = 'StrictTenant',
  PlatformBypass = 'PlatformBypass',
}

/** Roles permitted to enter PlatformBypass when the route is explicitly marked. */
export const PLATFORM_TENANT_BYPASS_ROLES: readonly UserRole[] = [
  'platform_super_admin',
  'platform_support',
] as const;

export function canUsePlatformTenantBypass(role: UserRole): boolean {
  return (PLATFORM_TENANT_BYPASS_ROLES as readonly string[]).includes(role);
}

export function buildTenantStore(input: {
  user: RequestUser;
  routeAllowsPlatformBypass: boolean;
}): TenantStore {
  const bypass =
    input.routeAllowsPlatformBypass &&
    canUsePlatformTenantBypass(input.user.role);

  return {
    organizationId: input.user.organizationId,
    bypassTenantScope: bypass,
    scopingMode: bypass
      ? TenantScopingMode.PlatformBypass
      : TenantScopingMode.StrictTenant,
  };
}

export function isPlatformBypassActive(store?: TenantStore): boolean {
  return store?.scopingMode === TenantScopingMode.PlatformBypass;
}

export function extractOrganizationIdFromWhere(
  where: unknown,
): string | undefined {
  if (!where || typeof where !== 'object') {
    return undefined;
  }

  const clause = where as Record<string, unknown>;

  if (typeof clause.organizationId === 'string') {
    return clause.organizationId;
  }

  if (
    clause.organizationId &&
    typeof clause.organizationId === 'object' &&
    !Array.isArray(clause.organizationId)
  ) {
    const nested = clause.organizationId as Record<string, unknown>;
    if (typeof nested.equals === 'string') {
      return nested.equals;
    }
  }

  if (typeof clause.organization_id === 'string') {
    return clause.organization_id;
  }

  for (const key of ['AND', 'OR'] as const) {
    const group = clause[key];
    if (Array.isArray(group)) {
      for (const nestedClause of group) {
        const found = extractOrganizationIdFromWhere(nestedClause);
        if (found) {
          return found;
        }
      }
    }
  }

  return undefined;
}
