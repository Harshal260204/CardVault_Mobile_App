import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { getTenantStore } from '../common/tenant/tenant-context.storage';
import {
  extractOrganizationIdFromWhere,
  isPlatformBypassActive,
} from '../common/tenant/tenant-scoping';
import { applyDatabaseUrlFromParts } from '../config/database-url';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly extendedClient: any;

  constructor() {
    super();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    applyDatabaseUrlFromParts();

    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const store = getTenantStore();
            const typedArgs = (args ?? {}) as {
              where?: Record<string, unknown>;
            };

            await self.applyTenantRls(typedArgs.where);

            if (!store?.organizationId || isPlatformBypassActive(store)) {
              return query(args);
            }

            const tenantModels = [
              'User',
              'Contact',
              'ContactEncounter',
              'EventSession',
              'SessionMember',
              'OcrJob',
              'CardImage',
              'AuditEvent',
              'Export',
              'SyncQueue',
              'Notification',
              'RelationshipMatch',
              'ContactMergeHistory',
              'RolePermission',
            ];

            if (tenantModels.includes(model)) {
              if (
                [
                  'findMany',
                  'findFirst',
                  'findUnique',
                  'count',
                  'update',
                  'updateMany',
                  'delete',
                  'deleteMany',
                ].includes(operation)
              ) {
                const scopedArgs = typedArgs;
                scopedArgs.where = scopedArgs.where ?? {};
                // If it is findUnique, Prisma requires the query to target unique fields.
                // However, adding a non-unique field to "where" makes it a non-unique query under the hood.
                // Prisma client extension automatically downgrades findUnique to findFirst if a non-unique field is added to where.
                scopedArgs.where.organizationId = store.organizationId;
                return query(scopedArgs);
              }
            }

            return query(args);
          },
        },
      },
    });

    return new Proxy(this, {
      get(target, prop) {
        if (
          prop === 'onModuleInit' ||
          prop === 'onModuleDestroy' ||
          prop === 'applyTenantRls' ||
          prop === 'withTenantRls' ||
          prop === 'extendedClient'
        ) {
          const value = Reflect.get(target, prop);
          return typeof value === 'function'
            ? (value as any).bind(target)
            : value;
        }
        const ext = (target as any).extendedClient;
        const value = Reflect.get(ext, prop);
        return typeof value === 'function' ? (value as any).bind(ext) : value;
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Apply RLS session variables for the current async context. */
  async applyTenantRls(where?: Record<string, unknown>): Promise<void> {
    const store = getTenantStore();

    if (isPlatformBypassActive(store)) {
      const explicitOrgId = extractOrganizationIdFromWhere(where);
      if (explicitOrgId) {
        await this
          .$executeRaw`SELECT set_config('app.platform_bypass_rls', 'false', true)`;
        await this
          .$executeRaw`SELECT set_config('app.current_org_id', ${explicitOrgId}, true)`;
        return;
      }

      await this.$executeRaw`SELECT set_config('app.current_org_id', '', true)`;
      await this
        .$executeRaw`SELECT set_config('app.platform_bypass_rls', 'true', true)`;
      return;
    }

    await this
      .$executeRaw`SELECT set_config('app.platform_bypass_rls', 'false', true)`;

    if (!store?.organizationId) {
      await this.$executeRaw`SELECT set_config('app.current_org_id', '', true)`;
      return;
    }

    await this
      .$executeRaw`SELECT set_config('app.current_org_id', ${store.organizationId}, true)`;
  }

  async withTenantRls<T>(fn: () => Promise<T>): Promise<T> {
    await this.applyTenantRls();
    return fn();
  }
}
