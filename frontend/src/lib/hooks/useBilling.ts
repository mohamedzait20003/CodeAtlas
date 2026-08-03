import { useMutation, useQuery } from "@tanstack/react-query";

import { getPlans, startCheckout } from "@/lib/handlers/billingHandlers";
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
