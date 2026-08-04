import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { SubscriptionStatus } from '@/shared/Domain/enums/subscription-status.enum';
import type {
  CheckoutContext,
  CheckoutResult,
  NormalizedEvent,
  NormalizedEventKind,
  NormalizedSubscription,
  PaymentGateway,
  PaymentInterval,
} from './payment-gateway';

/** Stripe subscription status → our projection status. */
const STATUS: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  active: SubscriptionStatus.ACTIVE,
  trialing: SubscriptionStatus.TRIALING,
  past_due: SubscriptionStatus.PAST_DUE,
  unpaid: SubscriptionStatus.PAST_DUE,
  incomplete: SubscriptionStatus.PAST_DUE,
  incomplete_expired: SubscriptionStatus.CANCELED,
  canceled: SubscriptionStatus.CANCELED,
  paused: SubscriptionStatus.CANCELED,
};

/** Stripe event name → what it means for the subscription projection. */
const EVENT_KINDS: Record<string, NormalizedEventKind> = {
  'checkout.session.completed': 'subscription.changed',
  'customer.subscription.created': 'subscription.changed',
  'customer.subscription.updated': 'subscription.changed',
  'customer.subscription.deleted': 'subscription.ended',
  'invoice.paid': 'subscription.changed',
  'invoice.payment_failed': 'payment.failed',
};

/** An expandable Stripe field is either the id or the object — take the id. */
function refOf(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const { id } = value as { id?: unknown };
    return typeof id === 'string' ? id : null;
  }
  return null;
}

/**
 * The period end moved from the subscription onto its items in Stripe's 2025
 * API versions — read the item first, then fall back to the legacy field.
 */
function periodEndOf(sub: Stripe.Subscription): Date | null {
  const item = sub.items?.data?.[0] as
    { current_period_end?: number } | undefined;
  const seconds =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
}

/** Likewise, an invoice's subscription moved under `parent`. */
function invoiceSubscriptionOf(invoice: Stripe.Invoice): string | null {
  const legacy = refOf(
    (invoice as unknown as { subscription?: unknown }).subscription,
  );
  if (legacy) return legacy;
  const parent = (
    invoice as unknown as {
      parent?: { subscription_details?: { subscription?: unknown } };
    }
  ).parent;
  return refOf(parent?.subscription_details?.subscription);
}

/**
 * Stripe adapter — the first concrete {@link PaymentGateway}. Uses Stripe
 * Checkout (hosted) in subscription mode; Stripe manages the recurring billing
 * and reports it back through webhooks. The client is created lazily so a
 * missing key fails checkout (not app boot).
 */
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

  verifyAndParse(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): NormalizedEvent {
    const secret = this.config.get<string>('stripe.webhookSecret');
    if (!secret) {
      throw new ServiceUnavailableException(
        'Stripe webhooks are not configured (STRIPE_WEBHOOK_SECRET is missing).',
      );
    }
    const signature = headers['stripe-signature'];
    if (typeof signature !== 'string') {
      throw new BadRequestException('Missing stripe-signature header.');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    const kind = EVENT_KINDS[event.type] ?? 'ignored';
    const base = { id: event.id, type: event.type, kind };
    if (kind === 'ignored') {
      return { ...base, subscriptionRef: null, userId: null };
    }

    // Pull the subscription ref + our userId out of whichever object it is.
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      return {
        ...base,
        subscriptionRef: refOf(session.subscription),
        userId: session.metadata?.userId ?? null,
      };
    }
    if (event.type.startsWith('invoice.')) {
      const invoice = event.data.object as Stripe.Invoice;
      return {
        ...base,
        subscriptionRef: invoiceSubscriptionOf(invoice),
        userId: null,
      };
    }
    const subscription = event.data.object as Stripe.Subscription;
    return {
      ...base,
      subscriptionRef: subscription.id,
      userId: subscription.metadata?.userId ?? null,
    };
  }

  async fetchSubscription(ref: string): Promise<NormalizedSubscription | null> {
    let sub: Stripe.Subscription;
    try {
      sub = await this.stripe.subscriptions.retrieve(ref);
    } catch {
      return null; // gone on Stripe's side
    }

    const price = sub.items?.data?.[0]?.price;
    const interval = price?.recurring?.interval;

    return {
      ref: sub.id,
      status: STATUS[sub.status] ?? SubscriptionStatus.CANCELED,
      priceRef: price?.id ?? null,
      interval:
        interval === 'month' || interval === 'year'
          ? (interval as PaymentInterval)
          : null,
      currentPeriodEnd: periodEndOf(sub),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      userId: sub.metadata?.userId ?? null,
      customerRef: refOf(sub.customer),
    };
  }
}
