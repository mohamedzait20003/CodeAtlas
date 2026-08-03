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

export interface PaymentGateway {
  readonly key: string;
  readonly capabilities: { managesRecurring: boolean };
  createCheckout(ctx: CheckoutContext): Promise<CheckoutResult>;
}
