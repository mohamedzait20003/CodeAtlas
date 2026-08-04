import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';

import { WebhookService } from '@/modules/subscription/services/webhook.service';
import {
  BILLING_ROUTE,
  SubscriptionBaseController,
} from './subscription-base.controller';

/**
 * POST /billing/webhook/:gateway — gateway callbacks.
 *
 * Deliberately unauthenticated (no `@Roles`): the caller is the payment gateway,
 * and authenticity comes from the signature check over the **raw** body (hence
 * `rawBody: true` in the bootstrap — a re-serialized body would break it).
 */
@Controller(BILLING_ROUTE)
export class WebhookController extends SubscriptionBaseController {
  constructor(private readonly webhooks: WebhookService) {
    super();
  }

  @Post('webhook/:gateway')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('gateway') gateway: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw request body.');
    }
    await this.webhooks.ingest(gateway, req.rawBody, req.headers);
    return { received: true };
  }
}
