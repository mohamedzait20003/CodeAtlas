import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import type {
  CheckoutContext,
  CheckoutResult,
  PaymentGateway,
} from './payment-gateway';

/** Stripe adapter — the first concrete {@link PaymentGateway}. Uses Stripe
 * Checkout (hosted) in subscription mode; Stripe manages the recurring billing.
 * The client is created lazily so a missing key fails checkout (not app boot). */
@Injectable()
export class StripeGateway implements PaymentGateway {
  readonly key = 'stripe';
  readonly capabilities = { managesRecurring: true };
  private client: Stripe | null = null;

  constructor(private readonly config: ConfigService) {}

  private get stripe(): Stripe {
    if (!this.client) {
      const key = this.config.get<string>('stripe.secretKey');
      if (!key) {
        throw new ServiceUnavailableException(
          'Stripe is not configured (STRIPE_SECRET_KEY is missing).',
        );
      }
      this.client = new Stripe(key);
    }
    return this.client;
  }

  async createCheckout(ctx: CheckoutContext): Promise<CheckoutResult> {
    let customerRef = ctx.customerRef;
    if (!customerRef) {
      const customer = await this.stripe.customers.create({
        email: ctx.email ?? undefined,
        metadata: { userId: ctx.userId },
      });
      customerRef = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerRef,
      line_items: [{ price: ctx.priceRef, quantity: 1 }],
      success_url: ctx.successUrl,
      cancel_url: ctx.cancelUrl,
      metadata: {
        userId: ctx.userId,
        planTier: ctx.planTier,
        interval: ctx.interval,
      },
      subscription_data: {
        metadata: { userId: ctx.userId, planTier: ctx.planTier },
      },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }
    return { action: { kind: 'redirect', url: session.url }, customerRef };
  }
}
