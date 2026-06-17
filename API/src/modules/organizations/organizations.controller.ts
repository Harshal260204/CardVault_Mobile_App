import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformTenantBypass } from '../../common/decorators/platform-tenant-bypass.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import type { RequestUser } from '../auth/auth.types';

@Controller('admin/organizations')
@Roles(UserRole.platform_super_admin)
@PlatformTenantBypass()
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  async list() {
    const items = await this.organizations.list();
    return { data: items };
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const org = await this.organizations.getById(id);
    return { data: org };
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateOrganizationDto,
  ) {
    const org = await this.organizations.create(user, dto);
    return { data: org };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const org = await this.organizations.update(user, id, dto);
    return { data: org };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.organizations.remove(user, id);
    return { data: result };
  }
}
