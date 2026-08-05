import type { ApiResponse } from "./baseModel";

export type PaymentInterval = "month" | "year";

export interface PlanPriceView {
  Interval: string;
  /** Minor units (e.g. cents). */
  Amount: number;
  Currency: string;
}

/** Everything the pricing + billing pages render for one plan (from the API). */
export interface PlanView {
  Tier: string;
  Name: string;
  Description: string;
  CtaLabel: string;
  Highlight: boolean;
  PriceMonthly: number;
  Prices: PlanPriceView[];

  /** Credits granted per week. -1 = unlimited. */
  WeeklyCredits: number;
  /** Roughly how many runs the weekly grant buys. -1 = unlimited. */
  ApproxProjectReadmes: number;
  ApproxProfileComposes: number;

  ModelTier: string;
  PrivateRepos: boolean;
  BulkGenerate: boolean;
  DirectPush: boolean;
  Watermark: boolean;
  /** 0 = none, -1 = unlimited. */
  CustomTemplates: number;
  /** -1 = unlimited. */
  HistoryRetentionDays: number;
  ApiAccess: boolean;
  Support: string;
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
