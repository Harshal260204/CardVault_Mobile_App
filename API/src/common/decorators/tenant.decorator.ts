import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  TENANT_REQUEST_KEY,
  type TenantContext,
} from '../tenant/tenant-context';
import type { RequestWithTenant } from '../interceptors/tenant-context.interceptor';

export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const req = ctx.switchToHttp().getRequest<RequestWithTenant>();
    const tenant = req[TENANT_REQUEST_KEY];
    if (!tenant) {
      throw new Error('Tenant context missing — ensure user is authenticated');
    }
    return tenant;
  },
);
