import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserRole, type Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../../common/services/audit.service';
import {
  resolvePagination,
  toPaginatedResult,
} from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';

import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { toOrgUserDto, type OrgUserDto } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: RequestUser, query: ListUsersQueryDto) {
    const { page, limit, skip, take } = resolvePagination(
      query.page,
      query.limit,
    );
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (query.role) {
      where.role = query.role;
    }

    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { fullName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPaginatedResult(items.map(toOrgUserDto), total, page, limit);
  }

  async getById(user: RequestUser, id: string): Promise<OrgUserDto> {
    const found = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!found) {
      throw new NotFoundException('User not found');
    }
    return toOrgUserDto(found);
  }

  async update(
    actor: RequestUser,
    id: string,
    dto: UpdateUserDto,
  ): Promise<OrgUserDto> {
    const target = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    this.assertCanManageTarget(actor, target.role);

    if (dto.role !== undefined) {
      this.assertCanChangeRole(actor, dto.role);
    }

    if (id === actor.id && dto.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim(),
        role: dto.role,
        isActive: dto.isActive,
      },
    });

    if (dto.isActive === false) {
      await this.prisma.authRefreshSession.deleteMany({
        where: { userId: id },
      });
    }

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'user.updated',
      entityType: 'user',
      entityId: id,
      eventData: {
        role: dto.role,
        isActive: dto.isActive,
        fullName: dto.fullName,
      },
    });

    return toOrgUserDto(updated);
  }

  async create(actor: RequestUser, dto: CreateUserDto): Promise<OrgUserDto> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const targetRole = dto.role ?? UserRole.user;
    if (actor.role !== UserRole.super_admin && targetRole === UserRole.super_admin) {
      throw new ForbiddenException('Only super admins can create super admin accounts');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName?.trim() || null,
        role: targetRole,
        passwordHash,
        isActive: true,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'user.created',
      entityType: 'user',
      entityId: newUser.id,
      eventData: {
        email: newUser.email,
        role: newUser.role,
      },
    });

    return toOrgUserDto(newUser);
  }

  async remove(
    actor: RequestUser,
    id: string,
  ): Promise<{ id: string; deleted: true }> {
    const target = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    this.assertCanManageTarget(actor, target.role);

    if (id === actor.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
    await this.prisma.authRefreshSession.deleteMany({ where: { userId: id } });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'user.deleted',
      entityType: 'user',
      entityId: id,
    });

    return { id, deleted: true };
  }

  private assertCanManageTarget(
    actor: RequestUser,
    targetRole: UserRole,
  ): void {
    if (actor.role === UserRole.super_admin) return;
    throw new ForbiddenException('Insufficient permissions');
  }

  private assertCanChangeRole(actor: RequestUser, nextRole: string): void {
    if (actor.role === UserRole.super_admin) return;
    throw new ForbiddenException('Insufficient permissions');
  }
}
