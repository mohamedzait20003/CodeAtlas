import { baseApi } from "../api/baseApi";
import type {
  CancellationResponse,
  CheckoutResponse,
  PaymentInterval,
  PlansResponse,
} from "../models/billingModel";

/** Plans + prices for the caller's region gateway. */
export async function getPlans(): Promise<PlansResponse> {
  const res = await baseApi.get<PlansResponse>("/billing/plans");
  return res.data;
}

/** A hosted-checkout URL for the chosen tier + interval. */
export async function startCheckout(
  planTier: string,
  interval: PaymentInterval,
): Promise<CheckoutResponse> {
  const res = await baseApi.post<CheckoutResponse>("/billing/checkout", {
    planTier,
    interval,
  });
  return res.data;
}

/** What cancelling now would do — end date + any refund. No side effects. */
export async function getCancellationPreview(): Promise<CancellationResponse> {
  const res = await baseApi.get<CancellationResponse>("/billing/cancellation");
  return res.data;
}

/** Apply the plan's cancellation policy. */
export async function cancelSubscription(): Promise<CancellationResponse> {
  const res = await baseApi.post<CancellationResponse>("/billing/cancel", {});
  return res.data;
}
