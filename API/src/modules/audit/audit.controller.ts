import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AuditEventsService } from './audit.service';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformTenantBypass } from '../../common/decorators/platform-tenant-bypass.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import type { RequestUser } from '../auth/auth.types';

@Controller('audit-events')
@Roles(
  UserRole.manager,
  UserRole.tenant_admin,
  UserRole.platform_super_admin,
  UserRole.platform_support,
)
@PlatformTenantBypass()
export class AuditEventsController {
  constructor(private readonly auditEventsService: AuditEventsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListAuditQueryDto,
  ) {
    const result = await this.auditEventsService.list(user, query);
    return {
      data: result.items,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }
}
