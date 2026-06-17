import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import type { RequestUser } from '../auth/auth.types';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { verifyStripeWebhookSignature } from './stripe.util';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('subscription')
  @Roles(
    UserRole.manager,
    UserRole.tenant_admin,
    UserRole.platform_super_admin,
    UserRole.platform_support,
  )
  async subscription(@CurrentUser() user: RequestUser) {
    return { data: await this.billing.getSubscription(user) };
  }

  @Post('checkout')
  @Roles(
    UserRole.manager,
    UserRole.tenant_admin,
    UserRole.platform_super_admin,
    UserRole.platform_support,
  )
  async checkout(@CurrentUser() user: RequestUser, @Body() dto: CreateCheckoutDto) {
    const session = await this.billing.createCheckoutSession(
      user,
      dto.planCode,
      dto.successUrl,
      dto.cancelUrl,
    );
    return { data: session };
  }

  @Post('portal')
  @Roles(
    UserRole.manager,
    UserRole.tenant_admin,
    UserRole.platform_super_admin,
    UserRole.platform_support,
  )
  async portal(@CurrentUser() user: RequestUser) {
    return { data: await this.billing.createPortalSession(user) };
  }

  @Public()
  @Post('webhooks/stripe')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!this.billing.enabled) {
      return { data: { received: false, reason: 'billing_disabled' } };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw request body for Stripe webhook');
    }
    if (!webhookSecret || !signature) {
      throw new BadRequestException('Stripe webhook secret or signature missing');
    }
    if (!verifyStripeWebhookSignature(rawBody, signature, webhookSecret)) {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const body = JSON.parse(rawBody.toString('utf8')) as {
      type?: string;
      data?: { object?: Record<string, unknown> };
    };
    const type = body.type;
    const object = body.data?.object;

    if (type === 'checkout.session.completed' && object) {
      const customerId = String(object.customer ?? '');
      const metadata = (object.metadata ?? {}) as Record<string, string>;
      await this.billing.handleCheckoutCompleted(metadata, customerId);
    }

    if (type === 'customer.subscription.updated' && object) {
      const customerId = String(object.customer ?? '');
      const subId = String(object.id ?? '');
      const metadata = (object.metadata ?? {}) as Record<string, string>;
      const plan =
        metadata.planCode ??
        String(
          (object.items as { data?: { price?: { nickname?: string } }[] })?.data?.[0]
            ?.price?.nickname ?? 'pro',
        );
      await this.billing.handleSubscriptionUpdated(customerId, subId, plan);
    }

    if (type === 'customer.subscription.deleted' && object) {
      const customerId = String(object.customer ?? '');
      await this.billing.handleSubscriptionDeleted(customerId);
    }

    return { data: { received: true } };
  }
}
