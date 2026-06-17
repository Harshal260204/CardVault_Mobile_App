import { SetMetadata } from '@nestjs/common';

export const PLATFORM_TENANT_BYPASS_KEY = 'platformTenantBypass';

/**
 * Marks a controller/handler as eligible for Prisma tenant-scope bypass.
 * Bypass is only activated when the authenticated user has a platform role
 * (`platform_super_admin` or `platform_support`) — see TenantContextInterceptor.
 */
export const PlatformTenantBypass = () =>
  SetMetadata(PLATFORM_TENANT_BYPASS_KEY, true);
