import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { PlanTier } from '@/shared/Domain/enums/plan-tier.enum';
import { SubscriptionStatus } from '@/shared/Domain/enums/subscription-status.enum';
import type {
  NormalizedSubscription,
  PaymentGateway,
} from '@/modules/subscription/adapters/payment-gateway';

/**
 * Projects a gateway's subscription state onto our `subscriptions` row.
 *
 * The gateway is the source of truth: rather than replaying event deltas, we
 * always re-read the subscription and overwrite the projection. That makes
 * processing idempotent and order-independent — a duplicate or late webhook just
 * writes the same latest state — and lets Commit 3's reconciliation cron reuse
 * exactly this method.
 */
@Injectable()
export class SubscriptionProjectionService {
  private readonly logger = new Logger(SubscriptionProjectionService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    @InjectRepository(PlanPrice) private readonly prices: Repository<PlanPrice>,
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
  ) {}

  /** Re-read `ref` from the gateway and overwrite our row. */
  async project(
    gateway: PaymentGateway,
    ref: string,
    userIdHint: string | null,
  ): Promise<void> {
    const remote = await gateway.fetchSubscription(ref);
    if (!remote) {
      // Gone on the gateway's side — treat as ended for whoever owns the ref.
      const existing = await this.subscriptions.findOne({
        where: { gateway: gateway.key, gatewayRef: ref },
      });
      if (existing) await this.downgrade(existing);
      return;
    }

    const userId = await this.resolveUserId(remote, userIdHint);
    if (!userId) {
      this.logger.warn(
        `No user for ${gateway.key} subscription ${ref} — skipping.`,
      );
      return;
    }

    const ended =
      remote.status === SubscriptionStatus.CANCELED &&
      !remote.cancelAtPeriodEnd;

    const row =
      (await this.subscriptions.findOne({ where: { userId } })) ??
      this.subscriptions.create({ userId });

    row.gateway = gateway.key;
    row.gatewayRef = remote.ref;
    row.status = remote.status;
    row.interval = remote.interval;
    row.currentPeriodEnd = remote.currentPeriodEnd;
    row.cancelAtPeriodEnd = remote.cancelAtPeriodEnd;
    // A cancel-at-period-end keeps access until the period actually closes.
    row.effectiveEndAt = remote.cancelAtPeriodEnd
      ? remote.currentPeriodEnd
      : null;
    row.planId = ended
      ? await this.freePlanId()
      : ((await this.planIdForPrice(gateway.key, remote.priceRef)) ??
        row.planId ??
        (await this.freePlanId()));

    await this.subscriptions.save(row);
    this.logger.log(
      `Projected ${gateway.key} ${remote.ref}: ${remote.status}` +
        `${remote.cancelAtPeriodEnd ? ' (cancels at period end)' : ''}`,
    );
  }

  /** Mark a subscription ended and drop the user back to Free. */
  async downgrade(row: Subscription): Promise<void> {
    row.status = SubscriptionStatus.CANCELED;
    row.planId = await this.freePlanId();
    row.cancelAtPeriodEnd = false;
    row.effectiveEndAt = new Date();
    await this.subscriptions.save(row);
    this.logger.log(`Subscription ${row.gatewayRef ?? row.id} ended → Free.`);
  }

  /** Our user id: gateway metadata first, then the stored customer ref. */
  private async resolveUserId(
    remote: NormalizedSubscription,
    hint: string | null,
  ): Promise<string | null> {
    if (remote.userId) return remote.userId;
    if (hint) return hint;
    if (remote.customerRef) {
      const profile = await this.profiles.findOne({
        where: { stripeCustomerId: remote.customerRef },
      });
      if (profile) return profile.id;
    }
    const existing = await this.subscriptions.findOne({
      where: { gatewayRef: remote.ref },
    });
    return existing?.userId ?? null;
  }

  /** Map the gateway's price back to one of our plans. */
  private async planIdForPrice(
    gateway: string,
    priceRef: string | null,
  ): Promise<string | null> {
    if (!priceRef) return null;
    const price = await this.prices.findOne({ where: { gateway, priceRef } });
    return price?.planId ?? null;
  }

  private async freePlanId(): Promise<string> {
    const free = await this.plans.findOne({ where: { tier: PlanTier.FREE } });
    if (!free) throw new Error('No Free plan is configured.');
    return free.id;
  }
}
