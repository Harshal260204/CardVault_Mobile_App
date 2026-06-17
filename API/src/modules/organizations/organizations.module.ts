import { Module } from '@nestjs/common';
import { OrganizationQuotaService } from './organization-quota.service';
import { OrganizationsController } from './organizations.controller';
import { PlansController } from './plans.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController, PlansController],
  providers: [OrganizationsService, OrganizationQuotaService],
  exports: [OrganizationsService, OrganizationQuotaService],
})
export class OrganizationsModule {}
