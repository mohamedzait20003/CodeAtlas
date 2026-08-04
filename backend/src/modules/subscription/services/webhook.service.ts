import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentEvent } from '@/modules/subscription/entities/payment-event.entity';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';
import { BillingEventFactory } from '@/modules/subscription/factories/billing-event.factory';

/**
 * Webhook ingress. Gateways deliver at-least-once and expect a fast ack, so this
 * only does the cheap, safe part — verify the signature, record the event once
 * (unique on gateway+event_id), and hand it to the worker. All projection work
 * happens off the request in the billing worker.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(PaymentEvent)
    private readonly events: Repository<PaymentEvent>,
    private readonly gateways: PaymentGatewayFactory,
    private readonly queue: BillingEventFactory,
  ) {}

  /** Verify → persist (idempotent) → enqueue. Throws only on a bad signature. */
  async ingest(
    gatewayKey: string,
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    const gateway = this.gateways.resolveByKey(gatewayKey);
    const event = gateway.verifyAndParse(rawBody, headers);

    if (event.kind === 'ignored') return;

    // ON CONFLICT DO NOTHING — a re-delivery inserts nothing and is not requeued.
    const result = await this.events
      .createQueryBuilder()
      .insert()
      .into(PaymentEvent)
      .values({
        gateway: gateway.key,
        eventId: event.id,
        type: event.type,
        payload: event,
      })
      .orIgnore()
      .execute();

    const isNew = Array.isArray(result.raw) && result.raw.length > 0;
    if (!isNew) {
      this.logger.debug(
        `Duplicate ${gateway.key} event ${event.id} — skipped.`,
      );
      return;
    }

    await this.queue.queue(gateway.key, event.id);
  }
}
