import type { ApiResponse } from "./baseModel";

export type PaymentInterval = "month" | "year";

export interface PlanPriceView {
  Interval: string;
  /** Minor units (e.g. cents). */
  Amount: number;
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

/** What cancelling does (preview) or did (after confirming). */
export interface CancellationView {
  /** Access is kept until this instant (ISO). */
  EffectiveEnd: string;
  /** Minor units refunded — 0 on monthly plans. */
  RefundAmount: number;
  Currency: string;
  Interval: string | null;
  Reason: string;
}

export type PlansResponse = ApiResponse<PlanView[]>;
export type CheckoutResponse = ApiResponse<CheckoutView>;
export type CancellationResponse = ApiResponse<CancellationView>;
