import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformTenantBypass } from '../../common/decorators/platform-tenant-bypass.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import type { RequestUser } from '../auth/auth.types';

@Controller('analytics')
@Roles(
  UserRole.manager,
  UserRole.tenant_admin,
  UserRole.platform_super_admin,
  UserRole.platform_support,
)
@PlatformTenantBypass()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('lead-funnel')
  async leadFunnel(
    @CurrentUser() user: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    return { data: await this.analytics.leadFunnel(user, organizationId) };
  }

  @Get('encounter-types')
  async encounterTypes(
    @CurrentUser() user: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    return { data: await this.analytics.encounterTypes(user, organizationId) };
  }

  @Get('sessions')
  async sessions(
    @CurrentUser() user: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    return { data: await this.analytics.sessions(user, organizationId) };
  }

  @Get('platform')
  @Roles(UserRole.platform_super_admin)
  async platform(@CurrentUser() user: RequestUser) {
    return { data: await this.analytics.platform(user) };
  }
}
