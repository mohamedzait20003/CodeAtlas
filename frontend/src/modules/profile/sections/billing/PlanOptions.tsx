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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {TIERS.map((t) => {
        const current = t.tier === currentTier;
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
                  {t.price}
                </span>
                {t.period && (
                  <span className="text-sm text-muted-foreground">
                    {t.period}
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
                  !current && "bg-violet-600 text-white hover:bg-violet-700",
                )}
                variant={current ? "outline" : "default"}
                disabled={current}
              >
                {current ? "Current plan" : `Upgrade to ${t.name}`}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
