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

export type PlansResponse = ApiResponse<PlanView[]>;
export type CheckoutResponse = ApiResponse<CheckoutView>;
