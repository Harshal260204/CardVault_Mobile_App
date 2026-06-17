import { AsyncLocalStorage } from 'async_hooks';

import type { TenantScopingMode } from './tenant-scoping';

export interface TenantStore {
  organizationId?: string;
  bypassTenantScope?: boolean;
  scopingMode?: TenantScopingMode;
}

const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantStore(): TenantStore | undefined {
  return tenantStorage.getStore();
}

export function runWithTenantStore<T>(store: TenantStore, fn: () => T): T {
  return tenantStorage.run(store, fn);
}

export function enterTenantStore(store: TenantStore): void {
  tenantStorage.enterWith(store);
}
