import type { SubscriptionStatus } from '@/shared/Domain/enums/subscription-status.enum';

export type PaymentInterval = 'month' | 'year';

/** What the client must do to pay — for hosted checkout, a redirect. */
export interface CheckoutAction {
  kind: 'redirect';
  url: string;
}

export interface CheckoutContext {
  userId: string;
  email: string | null;
  /** Existing gateway customer ref (persisted on the profile), if any. */
  customerRef: string | null;
  planTier: string;
  interval: PaymentInterval;
  /** The gateway's own price identifier (from plan_prices). */
  priceRef: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  action: CheckoutAction;
  /** A (possibly newly created) gateway customer ref to persist. */
  customerRef: string | null;
}

/**
 * What a gateway event means for us, normalized away from provider vocabulary.
 * The projection only ever acts on `kind` — new gateways map their own event
 * names onto these four.
 */
export type NormalizedEventKind =
  | 'subscription.changed' // created / updated / renewed → re-project
  | 'subscription.ended' // cancelled or expired → downgrade
  | 'payment.failed' // dunning started
  | 'ignored'; // not billing-relevant

export interface NormalizedEvent {
  /** The gateway's own event id — our idempotency key. */
  id: string;
  /** The gateway's raw event name (kept for auditing). */
  type: string;
  kind: NormalizedEventKind;
  /** Gateway subscription this event concerns (null when `ignored`). */
  subscriptionRef: string | null;
  /** Our user id, when the gateway carries it in metadata. */
  userId: string | null;
}

/** A gateway subscription as the projection understands it. */
export interface NormalizedSubscription {
  ref: string;
  status: SubscriptionStatus;
  /** Gateway price id → maps to a plan via `plan_prices`. */
  priceRef: string | null;
  interval: PaymentInterval | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  /** A scheduled end date, when cancellation was set for a specific instant
   * (our policies end access at month end, not at the period end). */
  cancelAt: Date | null;
  /** Our user id from the gateway's metadata, when present. */
  userId: string | null;
  customerRef: string | null;
}

export interface RefundResult {
  /** The gateway's refund id. */
  ref: string;
  amount: number;
}

/**
 * A region-selected payment gateway (Strategy). Hosted checkout renders the
 * region's payment methods itself, so the app never lists methods.
 *
 * Webhook handling is deliberately two-step: {@link verifyAndParse} only
 * authenticates and classifies the event, then the worker calls
 * {@link fetchSubscription} and overwrites our projection with the gateway's
 * current truth — which makes processing idempotent and order-independent.
 */
export interface PaymentGateway {
  readonly key: string;
  /** Whether the gateway runs recurring billing itself (Stripe) vs. the app
   * scheduling charges. Drives who advances the period on renewal. */
  readonly capabilities: { managesRecurring: boolean };

  createCheckout(ctx: CheckoutContext): Promise<CheckoutResult>;

  /** Verify the webhook signature against the raw body, then classify it. */
  verifyAndParse(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): NormalizedEvent;

  /** The gateway's current state for a subscription (null if it's gone). */
  fetchSubscription(ref: string): Promise<NormalizedSubscription | null>;

  /** Schedule the subscription to end at `effectiveEnd` (access kept until then). */
  cancel(ref: string, effectiveEnd: Date): Promise<void>;

  /**
   * Refund `amount` (minor units) against the subscription's most recent
   * payment. Returns null when the gateway has nothing refundable.
   */
  refund(ref: string, amount: number): Promise<RefundResult | null>;
}
