import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import { stripeRequest } from './stripe.util';

type StripeCustomer = { id: string };
type StripeCheckoutSession = { id: string; url: string };
type StripePortalSession = { url: string };

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  get enabled(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  }

  private normalizePlanCode(plan: string): 'free' | 'pro' {
    return plan.trim().toLowerCase() === 'free' ? 'free' : 'pro';
  }

  private assertBillingRole(user: RequestUser) {
    const allowed: UserRole[] = [
      UserRole.manager,
      UserRole.tenant_admin,
      UserRole.platform_super_admin,
      UserRole.platform_support,
    ];
    if (!allowed.includes(user.role)) {
      throw new BadRequestException('Only managers can manage billing');
    }
  }

  async getSubscription(user: RequestUser) {
    this.assertBillingRole(user);
    const org = await this.prisma.organization.findFirst({
      where: { id: user.organizationId, deletedAt: null },
      include: { planDetails: true },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return {
      organizationId: org.id,
      plan: org.plan,
      planName: org.planDetails.name,
      planPriceInr: org.planDetails.priceInr,
      stripeCustomerId: org.stripeCustomerId,
      stripeSubscriptionId: org.stripeSubscriptionId,
      billingEnabled: this.enabled,
    };
  }

  async createCheckoutSession(
    user: RequestUser,
    planCode: 'pro',
    successUrl?: string,
    cancelUrl?: string,
  ) {
    this.assertBillingRole(user);
    if (!this.enabled) {
      throw new BadRequestException('Stripe billing is not configured');
    }

    const priceId = process.env.STRIPE_PRICE_PRO?.trim();
    if (!priceId) {
      throw new BadRequestException('STRIPE_PRICE_PRO is not configured');
    }

    const org = await this.prisma.organization.findFirst({
      where: { id: user.organizationId, deletedAt: null },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeRequest<StripeCustomer>('POST', '/customers', {
        email: user.email,
        name: org.name,
        metadata: { organizationId: org.id },
      });
      customerId = customer.id;
      await this.linkCustomerToOrganization(org.id, customerId);
    }

    const webBase = process.env.WEB_APP_URL?.trim() ?? 'http://localhost:3000';
    const session = await stripeRequest<StripeCheckoutSession>(
      'POST',
      '/checkout/sessions',
      {
        mode: 'subscription',
        customer: customerId,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': 1,
        success_url: successUrl ?? `${webBase}/admin/billing?status=success`,
        cancel_url: cancelUrl ?? `${webBase}/admin/billing?status=cancelled`,
        'metadata[organizationId]': org.id,
        'metadata[planCode]': planCode,
        'subscription_data[metadata][organizationId]': org.id,
        'subscription_data[metadata][planCode]': planCode,
      },
    );

    return { url: session.url, sessionId: session.id };
  }

  async createPortalSession(user: RequestUser, returnUrl?: string) {
    this.assertBillingRole(user);
    if (!this.enabled) {
      throw new BadRequestException('Stripe billing is not configured');
    }

    const org = await this.prisma.organization.findFirst({
      where: { id: user.organizationId, deletedAt: null },
    });
    if (!org?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer linked to this organization');
    }

    const webBase = process.env.WEB_APP_URL?.trim() ?? 'http://localhost:3000';
    const session = await stripeRequest<StripePortalSession>(
      'POST',
      '/billing_portal/sessions',
      {
        customer: org.stripeCustomerId,
        return_url: returnUrl ?? `${webBase}/admin/billing`,
      },
    );
    return { url: session.url };
  }

  async linkCustomerToOrganization(organizationId: string, stripeCustomerId: string) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId },
    });
  }

  async handleSubscriptionUpdated(
    stripeCustomerId: string,
    subscriptionId: string,
    plan: string,
  ) {
    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId },
    });
    if (!org) {
      this.logger.warn(`No org for Stripe customer ${stripeCustomerId}`);
      return;
    }
    return this.prisma.organization.update({
      where: { id: org.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        plan: this.normalizePlanCode(plan),
      },
    });
  }

  async handleSubscriptionDeleted(stripeCustomerId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { stripeCustomerId },
    });
    if (!org) return;
    return this.prisma.organization.update({
      where: { id: org.id },
      data: {
        stripeSubscriptionId: null,
        plan: 'free',
      },
    });
  }

  async handleCheckoutCompleted(metadata: Record<string, string>, customerId: string) {
    const organizationId = metadata.organizationId;
    const planCode = metadata.planCode ?? 'pro';
    if (!organizationId) return;
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        stripeCustomerId: customerId,
        plan: this.normalizePlanCode(planCode),
      },
    });
  }
}
