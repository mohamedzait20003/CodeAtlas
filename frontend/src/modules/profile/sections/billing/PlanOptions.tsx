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

import { cn } from "@/lib/utils/utils";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { usePlans, useStartCheckout } from "@/lib/hooks/useBilling";
import type { PaymentInterval } from "@/lib/models/billingModel";

interface Tier {
  tier: "free" | "starter" | "pro";
  name: string;
  price: string;
  period?: string;
  features: string[];
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    features: [
      "3 repositories",
      "5 repo READMEs / mo",
      "Compose Your Profile 1× / mo",
      "1 saved resume",
      "Manual & PR push",
    ],
  },
  {
    tier: "starter",
    name: "Starter",
    price: "$9",
    period: "/mo",
    features: [
      "25 repositories",
      "75 repo READMEs / mo",
      "Compose Your Profile 4× / mo",
      "5 saved resumes",
      "Private repos",
      "1 template",
    ],
    highlight: true,
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$29",
    period: "/mo",
    features: [
      "Unlimited repositories",
      "750 repo READMEs / mo",
      "Unlimited Compose Your Profile",
      "Unlimited resumes",
      "Bulk generate",
      "Direct-to-branch push",
    ],
  },
];

export function PlanOptions() {
  const { data } = useDashboard();
  const currentTier = data?.Plan.Tier ?? "free";
  const [interval, setInterval] = useState<PaymentInterval>("month");

  const { data: plans = [] } = usePlans();
  const checkout = useStartCheckout();

  /** Live price for a tier at the selected interval; falls back to the static one. */
  const priceFor = (t: Tier): { label: string; period: string } => {
    if (t.tier === "free") return { label: "$0", period: "" };
    const period = interval === "month" ? "/mo" : "/yr";
    const p = plans
      .find((pl) => pl.Tier === t.tier)
      ?.Prices.find((pr) => pr.Interval === interval);
    if (p) return { label: `$${Math.round(p.Amount / 100)}`, period };
    return { label: t.price, period };
  };

  const onUpgrade = (tier: string) =>
    checkout.mutate(
      { planTier: tier, interval },
      {
        onSuccess: (res) => {
          if (res.Data?.Url) window.location.href = res.Data.Url;
        },
      },
    );

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
        {TIERS.map((t) => {
          const current = t.tier === currentTier;
          const paid = t.tier !== "free";
          const price = priceFor(t);
          return (
            <Card
              key={t.tier}
              className={cn(current && "ring-2 ring-violet-500/40")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.name}</CardTitle>
                  {current && <Badge variant="violet">Current</Badge>}
                  {!current && t.highlight && (
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
                  {t.features.map((f) => (
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
                    !current && paid && "bg-violet-600 text-white hover:bg-violet-700",
                  )}
                  variant={current || !paid ? "outline" : "default"}
                  disabled={current || !paid || checkout.isPending}
                  onClick={paid ? () => onUpgrade(t.tier) : undefined}
                >
                  {current
                    ? "Current plan"
                    : !paid
                      ? "Free plan"
                      : checkout.isPending
                        ? "Starting…"
                        : `Upgrade to ${t.name}`}
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
