import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import type { RequestUser } from '../auth/auth.types';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

export interface ProductPlanDto {
  id: string;
  code: string;
  name: string;
  priceInr: number;
  billingInterval: string | null;
  description: string | null;
  isActive: boolean;
}

export interface OrganizationAdminDto {
  id: string;
  name: string;
  slug: string;
  plan: string;
  planName: string;
  planPriceInr: number;
  planBillingInterval: string | null;
  maxUsers: number;
  storageQuotaGb: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  managerEmail?: string;
  managerName?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private toDto(org: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    planDetails: {
      code: string;
      name: string;
      priceInr: number;
      billingInterval: string | null;
    };
    maxUsers: number;
    storageQuotaGb: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): OrganizationAdminDto {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      planName: org.planDetails.name,
      planPriceInr: org.planDetails.priceInr,
      planBillingInterval: org.planDetails.billingInterval,
      maxUsers: org.maxUsers,
      storageQuotaGb: org.storageQuotaGb,
      isActive: org.isActive,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async listPlans(): Promise<ProductPlanDto[]> {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ priceInr: 'asc' }, { name: 'asc' }],
    });

    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      priceInr: plan.priceInr,
      billingInterval: plan.billingInterval,
      description: plan.description,
      isActive: plan.isActive,
    }));
  }

  private async assertActivePlanExists(code: string) {
    const normalizedCode = code.trim().toLowerCase();
    const plan = await this.prisma.plan.findFirst({
      where: { code: normalizedCode, isActive: true },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async list(): Promise<OrganizationAdminDto[]> {
    const items = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        planDetails: true,
        users: {
          where: { role: UserRole.manager, deletedAt: null },
          select: { email: true, fullName: true },
        },
      },
    });
    return items.map((org) => {
      const manager = org.users?.[0];
      return {
        ...this.toDto(org),
        managerEmail: manager?.email,
        managerName: manager?.fullName || undefined,
      };
    });
  }

  async getById(id: string): Promise<OrganizationAdminDto> {
    const org = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        planDetails: true,
        users: {
          where: { role: UserRole.manager, deletedAt: null },
          select: { email: true, fullName: true },
        },
      },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    const manager = org.users?.[0];
    return {
      ...this.toDto(org),
      managerEmail: manager?.email,
      managerName: manager?.fullName || undefined,
    };
  }

  async create(
    actor: RequestUser,
    dto: CreateOrganizationDto,
  ): Promise<OrganizationAdminDto> {
    const slug = dto.slug.trim().toLowerCase();
    const plan = await this.assertActivePlanExists(dto.plan ?? 'free');
    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('Organization slug already exists');
    }

    const email = dto.managerEmail.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Manager email already exists');
    }

    const org = await this.prisma.$transaction(async (tx) => {
      const createdOrg = await tx.organization.create({
        data: {
          name: dto.name.trim(),
          slug,
          plan: plan.code,
          maxUsers: dto.maxUsers ?? 50,
          storageQuotaGb: dto.storageQuotaGb ?? 10,
        },
        include: {
          planDetails: true,
        },
      });

      const passwordHash = await bcrypt.hash(dto.managerPassword, 12);

      await tx.user.create({
        data: {
          organizationId: createdOrg.id,
          email,
          fullName: dto.managerName?.trim() || `${dto.name.trim()} Manager`,
          role: UserRole.manager,
          passwordHash,
          isActive: true,
        },
      });

      return createdOrg;
    });

    await this.audit.log({
      organizationId: org.id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'organization.created',
      entityType: 'organization',
      entityId: org.id,
      eventData: { slug: org.slug },
    });
    return {
      ...this.toDto(org),
      managerEmail: email,
      managerName: dto.managerName?.trim() || `${dto.name.trim()} Manager`,
    };
  }

  async update(
    actor: RequestUser,
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationAdminDto> {
    const existing = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        planDetails: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    const nextSlug = dto.slug?.trim().toLowerCase();
    if (nextSlug && nextSlug !== existing.slug) {
      const slugInUse = await this.prisma.organization.findFirst({
        where: {
          slug: nextSlug,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (slugInUse) {
        throw new ConflictException('Organization slug already exists');
      }
    }

    const nextPlan = dto.plan
      ? await this.assertActivePlanExists(dto.plan)
      : existing.planDetails;

    const org = await this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: nextSlug,
        plan: dto.plan ? nextPlan.code : undefined,
        maxUsers: dto.maxUsers,
        storageQuotaGb: dto.storageQuotaGb,
        isActive: dto.isActive,
      },
      include: {
        planDetails: true,
      },
    });
    await this.audit.log({
      organizationId: org.id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'organization.updated',
      entityType: 'organization',
      entityId: org.id,
      eventData: dto as Record<string, unknown>,
    });
    return this.toDto(org);
  }

  async remove(
    actor: RequestUser,
    id: string,
  ): Promise<{ id: string; deleted: true }> {
    const existing = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    await this.prisma.organization.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await this.audit.log({
      organizationId: id,
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'organization.deleted',
      entityType: 'organization',
      entityId: id,
    });

    return { id, deleted: true };
  }
}
