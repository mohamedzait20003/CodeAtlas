import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';

import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { SubscriptionStatus } from '@/shared/Domain/enums/subscription-status.enum';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';
import { SubscriptionProjectionService } from './subscription-projection.service';

/**
 * Safety net for webhooks that never arrived (gateway outage, exhausted
 * retries, a missed signature). Re-projects every live subscription from its
 * gateway using the same fetch-and-project path the webhook worker uses, so it
 * can never disagree with it.
 */
@Injectable()
export class BillingReconciliationService {
  private readonly logger = new Logger(BillingReconciliationService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    private readonly gateways: PaymentGatewayFactory,
    private readonly projection: SubscriptionProjectionService,
  ) {}

  /** Sweep all non-cancelled subscriptions that have a gateway reference. */
  async run(): Promise<void> {
    const rows = await this.subscriptions.find({
      where: {
        gatewayRef: Not(IsNull()),
        status: Not(SubscriptionStatus.CANCELED),
      },
    });
    if (!rows.length) return;

    let repaired = 0;
    for (const row of rows) {
      if (!row.gateway || !row.gatewayRef) continue;
      try {
        const gateway = this.gateways.resolveByKey(row.gateway);
        await this.projection.project(gateway, row.gatewayRef, row.userId);
        repaired += 1;
      } catch (err) {
        // One bad subscription must not stop the sweep.
        this.logger.warn(
          `Reconcile failed for ${row.gatewayRef}: ${
            err instanceof Error ? err.message : 'unknown error'
          }`,
        );
      }
    }
    this.logger.log(`Reconciled ${repaired}/${rows.length} subscriptions.`);
  }
}
