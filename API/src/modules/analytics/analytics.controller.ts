import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { Roles } from '../../common/decorators/roles.decorator';

import type { RequestUser } from '../auth/auth.types';

@Controller('analytics')
@Roles(
  UserRole.manager,
  UserRole.tenant_admin,
  UserRole.platform_super_admin,
  UserRole.platform_support,
)

export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('lead-funnel')
  async leadFunnel() {
    return { data: await this.analytics.leadFunnel() };
  }

  @Get('encounter-types')
  async encounterTypes() {
    return { data: await this.analytics.encounterTypes() };
  }

  @Get('sessions')
  async sessions() {
    return { data: await this.analytics.sessions() };
  }

  @Get('platform')
  @Roles(UserRole.platform_super_admin)
  async platform(@CurrentUser() user: RequestUser) {
    return { data: await this.analytics.platform(user) };
  }
}
