import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { PlanTier } from '@/shared/Domain/enums/plan-tier.enum';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';
import {
  CREDIT_ESTIMATES,
  CreditAction,
} from '@/shared/Domain/enums/credit-action.enum';
import type { PlanView } from '@/modules/subscription/dto/billing.dto';

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

  /** Plans + prices for a user's region (falls back to the default region). */
  async listPlans(userId: string): Promise<PlanView[]> {
    const profile = await this.profiles.findOne({ where: { id: userId } });
    return this.catalog(profile?.country ?? null);
  }

  /**
   * The full plan catalog for a region — everything the public pricing page and
   * the billing page render, so neither hard-codes tier details.
   */
  async catalog(region: string | null): Promise<PlanView[]> {
    const gateway = this.gateways.resolveByRegion(region);

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
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.priceMonthly - b.priceMonthly,
      )
      .map((plan) => ({
        Tier: plan.tier,
        Name: plan.name,
        Description: plan.description,
        CtaLabel: plan.ctaLabel,
        Highlight: plan.highlight,
        PriceMonthly: plan.priceMonthly,
        Prices: (byPlan.get(plan.id) ?? []).map((pr) => ({
          Interval: pr.interval,
          Amount: pr.amount,
          Currency: pr.currency,
        })),
        WeeklyCredits: plan.weeklyCredits,
        ApproxProjectReadmes: this.approxRuns(
          plan.weeklyCredits,
          CreditAction.PROJECT_COMPOSITION,
        ),
        ApproxProfileComposes: this.approxRuns(
          plan.weeklyCredits,
          CreditAction.PROFILE_COMPOSITION,
        ),
        ModelTier: plan.modelTier,
        PrivateRepos: plan.features.privateRepos,
        BulkGenerate: plan.features.bulkGenerate,
        DirectPush: plan.features.directPush,
        Watermark: plan.features.watermark,
        CustomTemplates: plan.features.customTemplates,
        HistoryRetentionDays: plan.features.historyRetentionDays,
        ApiAccess: plan.features.apiAccess,
        Support: plan.features.support,
      }));
  }

  /** How many runs of `action` a weekly grant buys (-1 stays unlimited). */
  private approxRuns(weeklyCredits: number, action: CreditAction): number {
    if (weeklyCredits < 0) return -1;
    return Math.floor(weeklyCredits / CREDIT_ESTIMATES[action]);
  }
}
