import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentEvent } from '@/modules/subscription/entities/payment-event.entity';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';
import type { NormalizedEvent } from '@/modules/subscription/adapters/payment-gateway';
import { SubscriptionProjectionService } from './subscription-projection.service';

/**
 * Consumes the `billing-events` queue: loads the verified event the HTTP handler
 * stored, then re-projects the subscription from its gateway. Already-processed
 * events are skipped, so a retry (or a duplicate delivery that slipped past the
 * unique index) is a no-op.
 */
@Injectable()
export class BillingEventRunner {
  private readonly logger = new Logger(BillingEventRunner.name);

  constructor(
    @InjectRepository(PaymentEvent)
    private readonly events: Repository<PaymentEvent>,
    private readonly gateways: PaymentGatewayFactory,
    private readonly projection: SubscriptionProjectionService,
  ) {}

  async run(gatewayKey: string, eventId: string): Promise<void> {
    const record = await this.events.findOne({
      where: { gateway: gatewayKey, eventId },
    });
    if (!record) {
      this.logger.warn(`Event ${gatewayKey}/${eventId} not found — skipping.`);
      return;
    }
    if (record.processedAt) {
      this.logger.debug(`Event ${eventId} already processed — skipping.`);
      return;
    }

    const event = record.payload as NormalizedEvent;
    const gateway = this.gateways.resolveByKey(gatewayKey);

    if (event.subscriptionRef) {
      // One path for every kind: re-read the gateway and overwrite our row.
      // 'payment.failed' needs no special case — the fetched status is past_due.
      await this.projection.project(
        gateway,
        event.subscriptionRef,
        event.userId,
      );
    }

    record.processedAt = new Date();
    await this.events.save(record);
  }
}
