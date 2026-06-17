import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
@Roles(
  UserRole.manager,
  UserRole.tenant_admin,
  UserRole.platform_super_admin,
  UserRole.platform_support,
)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async stats(@CurrentUser() user: RequestUser) {
    const data = await this.dashboardService.getStats(user);
    return { data };
  }
}
