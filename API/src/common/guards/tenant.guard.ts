import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { RequestUser } from '../../modules/auth/auth.types';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user?: RequestUser;
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      query?: Record<string, string>;
      method?: string;
      originalUrl?: string;
      url?: string;
    }>();

    const user = req.user;
    if (!user) {
      return true;
    }

    const orgId = user.organizationId;
    const candidates = [
      req.body?.organizationId,
      req.body?.organization_id,
      req.params?.organizationId,
      req.query?.organizationId,
    ];

    for (const value of candidates) {
      if (value && String(value) !== orgId) {
        // Only platform admins can perform cross-tenant operations
        if (
          user.role === 'platform_super_admin' ||
          user.role === 'platform_support'
        ) {
          continue;
        }
        throw new ForbiddenException('Cross-tenant access denied');
      }
    }

    return true;
  }
}
