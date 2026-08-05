import { Skeleton } from "@/common/components/ui/skeleton";

import { PlanCard } from "../../components/PlanCard";
import { usePublicPlans } from "@/lib/hooks/useBilling";
import { featureBullets, priceFor } from "@/lib/models/planDisplay";

export function PricingCardsSection() {
  const { data: plans = [], isLoading } = usePublicPlans();

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-112 rounded-3xl" />
              ))
            : plans.map((plan) => {
                const price = priceFor(plan, "month");
                return (
                  <PlanCard
                    key={plan.Tier}
                    name={plan.Name}
                    price={price.label}
                    period={price.period}
                    desc={plan.Description}
                    cta={plan.CtaLabel}
                    highlight={plan.Highlight}
                    popular={plan.Highlight}
                    features={featureBullets(plan)}
                  />
                );
              })}
        </div>
      </div>
    </section>
  );
}
