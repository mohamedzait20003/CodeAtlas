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
