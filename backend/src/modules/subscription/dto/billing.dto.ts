import { IsIn } from 'class-validator';

import { PlanTier } from '@/shared/Domain/enums/plan-tier.enum';
import type { PaymentInterval } from '@/modules/subscription/adapters/payment-gateway';

/** Body for POST /billing/checkout — a paid tier + billing interval. */
export class StartCheckoutDto {
  @IsIn([PlanTier.STARTER, PlanTier.PRO])
  planTier: PlanTier.STARTER | PlanTier.PRO;

  @IsIn(['month', 'year'])
  interval: PaymentInterval;
}

export interface PlanPriceView {
  Interval: string;
  Amount: number; // minor units
  Currency: string;
}

export interface PlanView {
  Tier: string;
  Name: string;
  PriceMonthly: number;
  Prices: PlanPriceView[];
}

export interface CheckoutView {
  Url: string;
}

/** Inputs the cancellation rules need to decide an outcome. */
export interface CancellationRequest {
  now: Date;
  /** End of the paid term (the subscription's current period end). */
  periodEnd: Date | null;
  /** The plan's yearly price in minor units — used to prorate a refund. */
  yearlyAmount: number | null;
}

/** What the cancellation rules decided. */
export interface CancellationOutcome {
  /** Access is kept until this instant. */
  effectiveEnd: Date;
  /** Minor units to refund (0 when the policy grants none). */
  refundAmount: number;
  /** Human-readable summary for the confirmation UI. */
  reason: string;
}

/** What cancelling does (preview) or did (after POST /billing/cancel). */
export interface CancellationView {
  /** Access is kept until this instant (ISO). */
  EffectiveEnd: string;
  /** Minor units refunded — 0 on monthly plans. */
  RefundAmount: number;
  Currency: string;
  Interval: string | null;
  Reason: string;
}
