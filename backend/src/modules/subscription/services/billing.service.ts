import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';
import type {
  CheckoutView,
  StartCheckoutDto,
} from '@/modules/subscription/dto/billing.dto';

/**
 * Payment orchestration (Commit 1: region → gateway → hosted checkout). Talks to
 * gateways only through the {@link PaymentGatewayFactory}; the region (the user's
 * country, else the configured default) selects which hosted checkout is used.
 * The plan catalog itself lives in `PlansService`.
 */
@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    @InjectRepository(PlanPrice) private readonly prices: Repository<PlanPrice>,
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly gateways: PaymentGatewayFactory,
    private readonly config: ConfigService,
  ) {}

  /** Create a hosted checkout for the tier/interval via the region's gateway. */
  async createCheckout(
    userId: string,
    dto: StartCheckoutDto,
  ): Promise<CheckoutView> {
    const profile = await this.profiles.findOne({ where: { id: userId } });
    const gateway = this.gateways.resolveByRegion(profile?.country);

    const plan = await this.plans.findOne({ where: { tier: dto.planTier } });
    if (!plan) throw new NotFoundException('Plan not found.');

    const price = await this.prices.findOne({
      where: { planId: plan.id, gateway: gateway.key, interval: dto.interval },
    });
    if (!price) {
      throw new BadRequestException(
        'This plan is not available for checkout right now.',
      );
    }

    const user = await this.users.findOne({ where: { id: userId } });
    const result = await gateway.createCheckout({
      userId,
      email: user?.email ?? null,
      customerRef: profile?.stripeCustomerId ?? null,
      planTier: dto.planTier,
      interval: dto.interval,
      priceRef: price.priceRef,
      successUrl: this.config.get<string>('billing.successUrl')!,
      cancelUrl: this.config.get<string>('billing.cancelUrl')!,
    });

    // Persist a newly created gateway customer ref for reuse.
    if (
      profile &&
      result.customerRef &&
      result.customerRef !== profile.stripeCustomerId
    ) {
      profile.stripeCustomerId = result.customerRef;
      await this.profiles.save(profile);
    }

    return { Url: result.action.url };
  }
}
