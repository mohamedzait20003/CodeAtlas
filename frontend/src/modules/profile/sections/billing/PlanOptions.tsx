import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { cn } from "@/lib/utils/utils";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { usePlans, useStartCheckout } from "@/lib/hooks/useBilling";
import { featureBullets, priceFor } from "@/lib/models/planDisplay";
import type { PaymentInterval } from "@/lib/models/billingModel";

function ctaLabel(
  current: boolean,
  paid: boolean,
  pending: boolean,
  name: string,
): string {
  if (current) return "Current plan";
  if (!paid) return "Free plan";
  return pending ? "Starting…" : `Upgrade to ${name}`;
}

/** Upgrade/downgrade options — tiers come from GET /billing/plans. */
export function PlanOptions() {
  const { data } = useDashboard();
  const currentTier = data?.Plan.Tier ?? "free";
  const [interval, setInterval] = useState<PaymentInterval>("month");

  const { data: plans = [], isLoading } = usePlans();
  const checkout = useStartCheckout();

  const onUpgrade = (tier: string) =>
    checkout.mutate(
      { planTier: tier, interval },
      {
        onSuccess: (res) => {
          if (res.Data?.Url) window.location.href = res.Data.Url;
        },
      },
    );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-96 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Billing interval */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-border p-1">
          {(["month", "year"] as const).map((iv) => (
            <button
              key={iv}
              type="button"
              onClick={() => setInterval(iv)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                interval === iv
                  ? "bg-violet-600 text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {iv === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const current = plan.Tier === currentTier;
          const paid = plan.PriceMonthly > 0;
          const price = priceFor(plan, interval);
          return (
            <Card
              key={plan.Tier}
              className={cn(current && "ring-2 ring-violet-500/40")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.Name}</CardTitle>
                  {current && <Badge variant="violet">Current</Badge>}
                  {!current && plan.Highlight && (
                    <Badge variant="emerald">Popular</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-3xl font-extrabold text-foreground">
                    {price.label}
                  </span>
                  {price.period && (
                    <span className="text-sm text-muted-foreground">
                      {price.period}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {featureBullets(plan).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={cn(
                    "w-full",
                    !current &&
                      paid &&
                      "bg-violet-600 text-white hover:bg-violet-700",
                  )}
                  variant={current || !paid ? "outline" : "default"}
                  disabled={current || !paid || checkout.isPending}
                  onClick={paid ? () => onUpgrade(plan.Tier) : undefined}
                >
                  {ctaLabel(current, paid, checkout.isPending, plan.Name)}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {checkout.error && (
        <p className="text-center text-sm text-destructive">
          {checkout.error.message}
        </p>
      )}
    </div>
  );
}
