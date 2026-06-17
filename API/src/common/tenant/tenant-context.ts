import type { TenantScopingMode } from './tenant-scoping';
import type { UserRole } from '@prisma/client';

export interface TenantContext {
  organizationId: string;
  userId: string;
  role: UserRole;
  bypassTenantScope?: boolean;
  scopingMode?: TenantScopingMode;
}

export const TENANT_REQUEST_KEY = 'tenant';
