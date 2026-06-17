import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { PLATFORM_TENANT_BYPASS_KEY } from '../decorators/platform-tenant-bypass.decorator';
import {
  TENANT_REQUEST_KEY,
  type TenantContext,
} from '../tenant/tenant-context';
import { runWithTenantStore } from '../tenant/tenant-context.storage';
import { buildTenantStore } from '../tenant/tenant-scoping';

import type { RequestUser } from '../../modules/auth/auth.types';

export type RequestWithTenant = {
  user?: RequestUser;
  [TENANT_REQUEST_KEY]?: TenantContext;
};

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = req.user;

    if (!user) {
      return next.handle();
    }

    const routeAllowsPlatformBypass =
      this.reflector.getAllAndOverride<boolean>(PLATFORM_TENANT_BYPASS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    const store = buildTenantStore({ user, routeAllowsPlatformBypass });

    req[TENANT_REQUEST_KEY] = {
      organizationId: user.organizationId,
      userId: user.id,
      role: user.role,
      bypassTenantScope: store.bypassTenantScope,
      scopingMode: store.scopingMode,
    };

    return new Observable((subscriber) => {
      runWithTenantStore(store, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
