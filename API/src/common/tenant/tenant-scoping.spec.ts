import {
  buildTenantStore,
  canUsePlatformTenantBypass,
  extractOrganizationIdFromWhere,
  TenantScopingMode,
} from './tenant-scoping';

import type { RequestUser } from '../../modules/auth/auth.types';

const platformAdmin: RequestUser = {
  id: 'admin-1',
  organizationId: 'org-a',
  role: 'platform_super_admin',
  email: 'admin@test.com',
  jti: 'jti-admin',
};

const manager: RequestUser = {
  id: 'mgr-1',
  organizationId: 'org-b',
  role: 'manager',
  email: 'manager@test.com',
  jti: 'jti-mgr',
};

describe('tenant-scoping', () => {
  it('allows platform bypass only when route is marked and user is platform admin', () => {
    const store = buildTenantStore({
      user: platformAdmin,
      routeAllowsPlatformBypass: true,
    });

    expect(store.scopingMode).toBe(TenantScopingMode.PlatformBypass);
    expect(store.bypassTenantScope).toBe(true);
  });

  it('never enables bypass for non-platform roles even on marked routes', () => {
    const store = buildTenantStore({
      user: manager,
      routeAllowsPlatformBypass: true,
    });

    expect(store.scopingMode).toBe(TenantScopingMode.StrictTenant);
    expect(store.bypassTenantScope).toBe(false);
  });

  it('keeps strict mode for platform admins on unmarked routes', () => {
    const store = buildTenantStore({
      user: platformAdmin,
      routeAllowsPlatformBypass: false,
    });

    expect(store.scopingMode).toBe(TenantScopingMode.StrictTenant);
    expect(store.bypassTenantScope).toBe(false);
  });

  it('identifies platform bypass roles', () => {
    expect(canUsePlatformTenantBypass('platform_super_admin')).toBe(true);
    expect(canUsePlatformTenantBypass('platform_support')).toBe(true);
    expect(canUsePlatformTenantBypass('manager')).toBe(false);
    expect(canUsePlatformTenantBypass('employee')).toBe(false);
  });

  it('extracts explicit organizationId from nested where clauses', () => {
    expect(
      extractOrganizationIdFromWhere({
        AND: [{ organizationId: '11111111-1111-1111-1111-111111111111' }],
      }),
    ).toBe('11111111-1111-1111-1111-111111111111');
  });
});
