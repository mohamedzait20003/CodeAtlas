import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BaseQueueFactory } from '@/shared/Factories/base-queue.factory';

export interface BillingEventJob {
  gateway: string;
  /** The gateway's event id — the worker loads the stored `payment_events` row. */
  eventId: string;
}

export const BILLING_EVENT_QUEUE = 'billing-events';

/**
 * Queue for verified gateway webhooks. The HTTP handler only persists + enqueues
 * so it can ack within the gateway's timeout; the worker does the DB work with
 * retries.
 */
@Injectable()
export class BillingEventFactory extends BaseQueueFactory<BillingEventJob> {
  constructor(config: ConfigService) {
    super(config, BILLING_EVENT_QUEUE, 'billing.event', {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 200 },
    });
  }

  async queue(gateway: string, eventId: string): Promise<void> {
    await this.enqueue({ gateway, eventId });
  }
}
