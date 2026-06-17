import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformTenantBypass } from '../../common/decorators/platform-tenant-bypass.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import type { RequestUser } from '../auth/auth.types';

@Controller('users')
@Roles(
  UserRole.manager,
  UserRole.tenant_admin,
  UserRole.platform_super_admin,
  UserRole.platform_support,
)
@PlatformTenantBypass()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateUserDto) {
    const newUser = await this.usersService.create(user, dto);
    return { data: newUser };
  }

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListUsersQueryDto,
  ) {
    const result = await this.usersService.list(user, query);
    return {
      data: result.items,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const orgUser = await this.usersService.getById(user, id);
    return { data: orgUser };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const orgUser = await this.usersService.update(user, id, dto);
    return { data: orgUser };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.usersService.remove(user, id);
    return { data: result };
  }
}
