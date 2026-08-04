import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelSubscription,
  getCancellationPreview,
  getPlans,
  startCheckout,
} from "@/lib/handlers/billingHandlers";
import type { PaymentInterval } from "@/lib/models/billingModel";

/** Plans + prices (rarely change — cached). */
export function usePlans() {
  return useQuery({
    queryKey: ["billing-plans"],
    queryFn: getPlans,
    staleTime: 5 * 60_000,
    select: (res) => res.Data ?? [],
  });
}

/** Start hosted checkout for a tier/interval → redirect to the returned URL. */
export function useStartCheckout() {
  return useMutation({
    mutationFn: (vars: { planTier: string; interval: PaymentInterval }) =>
      startCheckout(vars.planTier, vars.interval),
  });
}

/**
 * The end date + refund cancelling would produce. Only fetched when the user
 * opens the confirmation (`enabled`) — it's a per-subscription computation.
 */
export function useCancellationPreview(enabled: boolean) {
  return useQuery({
    queryKey: ["billing-cancellation"],
    queryFn: getCancellationPreview,
    enabled,
    staleTime: 60_000,
    select: (res) => res.Data,
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      // Plan/status changed — refresh the dashboard summary.
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      void qc.invalidateQueries({ queryKey: ["billing-cancellation"] });
    },
  });
}
