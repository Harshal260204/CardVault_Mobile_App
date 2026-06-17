import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { OrganizationsService } from './organizations.service';
import { PlatformTenantBypass } from '../../common/decorators/platform-tenant-bypass.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/plans')
@Roles(UserRole.platform_super_admin)
@PlatformTenantBypass()
export class PlansController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  async list() {
    const items = await this.organizations.listPlans();
    return { data: items };
  }
}
