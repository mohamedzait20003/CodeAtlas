import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { SubscriptionStatus } from '@/shared/Domain/enums/subscription-status.enum';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';
import { CancellationPolicyFactory } from '@/modules/subscription/factories/cancellation-policy.factory';
import type {
  CancellationOutcome,
  CancellationView,
} from '@/modules/subscription/dto/billing.dto';

/**
 * Cancellation: the policy (per billing interval) decides *when* access ends and
 * *how much* is refunded; this service enacts that decision on the gateway.
 * Preview and cancel share the same computation so the confirmation the user
 * sees is exactly what gets applied.
 */
@Injectable()
export class CancellationService {
  private readonly logger = new Logger(CancellationService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(PlanPrice) private readonly prices: Repository<PlanPrice>,
    private readonly gateways: PaymentGatewayFactory,
    private readonly policies: CancellationPolicyFactory,
  ) {}

  /** What cancelling now would do — no side effects. */
  async preview(userId: string): Promise<CancellationView> {
    const { outcome, subscription } = await this.compute(userId);
    return this.view(outcome, subscription);
  }

  /** Apply the policy: schedule the end on the gateway and refund if owed. */
  async cancel(userId: string): Promise<CancellationView> {
    const { outcome, subscription } = await this.compute(userId);

    if (subscription.cancelAtPeriodEnd) {
      throw new BadRequestException(
        'This subscription is already scheduled to end.',
      );
    }
    if (!subscription.gateway || !subscription.gatewayRef) {
      throw new BadRequestException('This subscription has no payment record.');
    }

    const gateway = this.gateways.resolveByKey(subscription.gateway);
    await gateway.cancel(subscription.gatewayRef, outcome.effectiveEnd);

    if (outcome.refundAmount > 0) {
      const refund = await gateway.refund(
        subscription.gatewayRef,
        outcome.refundAmount,
      );
      this.logger.log(
        refund
          ? `Refunded ${refund.amount} for ${subscription.gatewayRef} (${refund.ref}).`
          : `No refundable payment found for ${subscription.gatewayRef}.`,
      );
    }

    // Reflect it immediately; the gateway's webhook re-projects the same state.
    subscription.cancelAtPeriodEnd = true;
    subscription.effectiveEndAt = outcome.effectiveEnd;
    await this.subscriptions.save(subscription);

    return this.view(outcome, subscription);
  }

  /** Load the subscription and run its interval's policy. */
  private async compute(userId: string): Promise<{
    outcome: CancellationOutcome;
    subscription: Subscription;
  }> {
    const subscription = await this.subscriptions.findOne({
      where: { userId },
    });
    if (!subscription) {
      throw new NotFoundException('You have no active subscription.');
    }
    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('This subscription has already ended.');
    }

    const yearly = subscription.gateway
      ? await this.prices.findOne({
          where: {
            planId: subscription.planId,
            gateway: subscription.gateway,
            interval: 'year',
          },
        })
      : null;

    const outcome = this.policies.resolve(subscription.interval, {
      now: new Date(),
      periodEnd: subscription.currentPeriodEnd,
      yearlyAmount: yearly?.amount ?? null,
    });

    return { outcome, subscription };
  }

  private async view(
    outcome: CancellationOutcome,
    subscription: Subscription,
  ): Promise<CancellationView> {
    const price = subscription.gateway
      ? await this.prices.findOne({
          where: {
            planId: subscription.planId,
            gateway: subscription.gateway,
            interval: subscription.interval ?? 'month',
          },
        })
      : null;

    return {
      EffectiveEnd: outcome.effectiveEnd.toISOString(),
      RefundAmount: outcome.refundAmount,
      Currency: price?.currency ?? 'usd',
      Interval: subscription.interval,
      Reason: outcome.reason,
    };
  }
}
