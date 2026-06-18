import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
@Roles(UserRole.super_admin)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async stats() {
    const data = await this.dashboardService.getStats();
    return { data };
  }
}
