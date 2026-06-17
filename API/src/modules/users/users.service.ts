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
import { OrganizationQuotaService } from '../organizations/organization-quota.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { toOrgUserDto, type OrgUserDto } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly quotas: OrganizationQuotaService,
  ) {}

  async list(user: RequestUser, query: ListUsersQueryDto) {
    const { page, limit, skip, take } = resolvePagination(
      query.page,
      query.limit,
    );
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (
      user.role === UserRole.platform_super_admin ||
      user.role === UserRole.platform_support
    ) {
      if (query.organizationId) {
        where.organizationId = query.organizationId;
      }
      if (query.role) {
        where.role = query.role;
      }
    } else {
      where.organizationId = user.organizationId;
      where.role = {
        in: [UserRole.employee, UserRole.manager, UserRole.tenant_admin],
      };
      if (
        query.role &&
        ['employee', 'manager', 'tenant_admin'].includes(query.role)
      ) {
        where.role = query.role as UserRole;
      }
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
        include: {
          organization: {
            select: { name: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPaginatedResult(items.map(toOrgUserDto), total, page, limit);
  }

  async getById(user: RequestUser, id: string): Promise<OrgUserDto> {
    const found = await this.prisma.user.findFirst({
      where:
        user.role === UserRole.platform_super_admin ||
        user.role === UserRole.platform_support
          ? {
              id,
              deletedAt: null,
            }
          : {
              id,
              organizationId: user.organizationId,
              role: {
                in: [
                  UserRole.employee,
                  UserRole.manager,
                  UserRole.tenant_admin,
                ],
              },
              deletedAt: null,
            },
      include: {
        organization: {
          select: { name: true },
        },
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
        ...(actor.role === UserRole.platform_super_admin ||
        actor.role === UserRole.platform_support
          ? {}
          : { organizationId: actor.organizationId }),
      },
      include: {
        organization: {
          select: { name: true },
        },
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

    if (dto.isActive === true && !target.isActive) {
      await this.quotas.assertOrgActive(target.organizationId);
      await this.quotas.assertCanAddUser(target.organizationId);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim(),
        role: dto.role,
        isActive: dto.isActive,
      },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (dto.isActive === false) {
      await this.prisma.authRefreshSession.deleteMany({
        where: { userId: id },
      });
    }

    await this.audit.log({
      organizationId: updated.organizationId,
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

    let organizationId = actor.organizationId;
    if (
      (actor.role === UserRole.platform_super_admin ||
        actor.role === UserRole.platform_support) &&
      dto.organizationId
    ) {
      organizationId = dto.organizationId;
    }

    const targetRole = dto.role ?? UserRole.employee;
    if (
      actor.role === UserRole.manager &&
      targetRole !== UserRole.employee &&
      targetRole !== UserRole.manager
    ) {
      throw new ForbiddenException(
        'Managers can only create employee or manager accounts',
      );
    }
    if (
      actor.role !== UserRole.platform_super_admin &&
      actor.role !== UserRole.platform_support &&
      (targetRole === UserRole.platform_super_admin ||
        targetRole === UserRole.platform_support)
    ) {
      throw new ForbiddenException(
        'Only platform admins can create platform accounts',
      );
    }

    await this.quotas.assertOrgActive(organizationId);
    await this.quotas.assertCanAddUser(organizationId);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const newUser = await this.prisma.user.create({
      data: {
        organizationId,
        email,
        fullName: dto.fullName?.trim() || null,
        role: targetRole,
        passwordHash,
        isActive: true,
      },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    await this.audit.log({
      organizationId: newUser.organizationId,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'user.created',
      entityType: 'user',
      entityId: newUser.id,
      eventData: {
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId,
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
        ...(actor.role === UserRole.platform_super_admin ||
        actor.role === UserRole.platform_support
          ? {}
          : { organizationId: actor.organizationId }),
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
      organizationId: target.organizationId,
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
    if (actor.role === UserRole.platform_super_admin) return;
    if (actor.role === UserRole.platform_support) {
      if (
        targetRole === UserRole.platform_super_admin ||
        targetRole === UserRole.platform_support
      ) {
        throw new ForbiddenException(
          'Platform support cannot manage other platform accounts',
        );
      }
      return;
    }
    if (actor.role === UserRole.tenant_admin) {
      if (
        targetRole === UserRole.platform_super_admin ||
        targetRole === UserRole.platform_support
      ) {
        throw new ForbiddenException(
          'Tenant admins cannot manage platform accounts',
        );
      }
      return;
    }
    if (actor.role === UserRole.manager) {
      if (targetRole !== UserRole.employee && targetRole !== UserRole.manager) {
        throw new ForbiddenException(
          'Managers can only manage employee or manager accounts',
        );
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  private assertCanChangeRole(actor: RequestUser, nextRole: string): void {
    if (actor.role === UserRole.platform_super_admin) return;
    if (nextRole === UserRole.platform_super_admin) {
      throw new ForbiddenException(
        'Only platform super admins can assign the platform super admin role',
      );
    }
    if (actor.role === UserRole.platform_support) {
      if (nextRole === UserRole.platform_support) {
        throw new ForbiddenException(
          'Platform support cannot assign platform roles',
        );
      }
      return;
    }
    if (actor.role === UserRole.tenant_admin) {
      if (
        nextRole === UserRole.platform_support ||
        nextRole === UserRole.platform_super_admin
      ) {
        throw new ForbiddenException(
          'Tenant admins cannot assign platform roles',
        );
      }
      return;
    }
    if (actor.role === UserRole.manager) {
      if (nextRole !== UserRole.employee && nextRole !== UserRole.manager) {
        throw new ForbiddenException(
          'Managers can only assign employee or manager roles',
        );
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }
}
