import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { PlanTier } from '@/shared/Domain/enums/plan-tier.enum';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';
import type { PlanView } from '@/modules/subscription/dto/billing.dto';

const PLAN_NAMES: Record<string, string> = {
  [PlanTier.FREE]: 'Free',
  [PlanTier.STARTER]: 'Starter',
  [PlanTier.PRO]: 'Pro',
};

/**
 * The plan catalog: a user's effective plan (their subscription's, or Free) and
 * the purchasable plan list with prices for their region's gateway.
 */
@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    @InjectRepository(PlanPrice) private readonly prices: Repository<PlanPrice>,
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
    private readonly gateways: PaymentGatewayFactory,
  ) {}

  /** The user's effective plan — their subscription's, or Free by default. */
  async forUser(userId: string): Promise<Plan> {
    const subscription = await this.subscriptions.findOne({
      where: { userId },
    });
    const plan =
      (subscription?.plan as Plan | undefined) ??
      (await this.plans.findOne({ where: { tier: PlanTier.FREE } }));
    if (!plan) throw new BadRequestException('No plan is configured.');
    return plan;
  }

  /** Plans + their prices for the caller's region gateway (for the pricing UI). */
  async listPlans(userId: string): Promise<PlanView[]> {
    const profile = await this.profiles.findOne({ where: { id: userId } });
    const gateway = this.gateways.resolveByRegion(profile?.country);

    const [plans, prices] = await Promise.all([
      this.plans.find(),
      this.prices.find({ where: { gateway: gateway.key } }),
    ]);

    const byPlan = new Map<string, PlanPrice[]>();
    for (const p of prices) {
      const list = byPlan.get(p.planId) ?? [];
      list.push(p);
      byPlan.set(p.planId, list);
    }

    return plans
      .sort((a, b) => a.priceMonthly - b.priceMonthly)
      .map((plan) => ({
        Tier: plan.tier,
        Name: PLAN_NAMES[plan.tier] ?? plan.tier,
        PriceMonthly: plan.priceMonthly,
        Prices: (byPlan.get(plan.id) ?? []).map((pr) => ({
          Interval: pr.interval,
          Amount: pr.amount,
          Currency: pr.currency,
        })),
      }));
  }
}
