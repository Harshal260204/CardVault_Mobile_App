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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { AddSessionMemberDto } from './dto/add-session-member.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListSessionsQueryDto,
  ) {
    const result = await this.sessionsService.list(user, query);
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
    const session = await this.sessionsService.getById(user, id);
    return { data: session };
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateSessionDto,
  ) {
    const session = await this.sessionsService.create(user, dto);
    return { data: session };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    const session = await this.sessionsService.update(user, id, dto);
    return { data: session };
  }

  @Post(':id/close')
  async close(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const session = await this.sessionsService.close(user, id);
    return { data: session };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.sessionsService.remove(user, id);
    return { data: result };
  }

  @Post(':id/join')
  async join(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.sessionsService.join(user, id);
    return { data: result };
  }

  @Post(':id/members')
  @Roles(
    UserRole.manager,
    UserRole.tenant_admin,
    UserRole.platform_super_admin,
    UserRole.platform_support,
  )
  async addMember(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddSessionMemberDto,
  ) {
    const result = await this.sessionsService.addMember(user, id, dto);
    return { data: result };
  }

  @Get(':id/stats')
  async stats(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const stats = await this.sessionsService.stats(user, id);
    return { data: stats };
  }

  @Get(':id/members')
  async members(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const members = await this.sessionsService.listMembers(user, id);
    return { data: members };
  }
}
