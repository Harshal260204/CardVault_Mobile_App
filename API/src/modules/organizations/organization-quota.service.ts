import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationQuotaExceededException } from '../../common/exceptions/domain.exceptions';

@Injectable()
export class OrganizationQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async assertOrgActive(organizationId: string): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org || !org.isActive || org.deletedAt) {
      throw new OrganizationQuotaExceededException('Organization is inactive');
    }
  }

  async assertCanAddUser(organizationId: string): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      return;
    }
    const count = await this.prisma.user.count({
      where: { organizationId, deletedAt: null, isActive: true },
    });
    if (count >= org.maxUsers) {
      throw new OrganizationQuotaExceededException(
        'Maximum user seats reached for this organization',
      );
    }
  }
}
