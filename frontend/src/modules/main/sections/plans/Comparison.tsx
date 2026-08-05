import { Check, Minus } from "lucide-react";
import { Card, CardContent } from "@/common/components/ui/card";
import { Separator } from "@/common/components/ui/separator";
import { Skeleton } from "@/common/components/ui/skeleton";
import { usePublicPlans } from "@/lib/hooks/useBilling";
import { amount } from "@/lib/models/planDisplay";
import type { PlanView } from "@/lib/models/billingModel";

/** 0 = none, -1 = unlimited, otherwise a count. */
function templates(count: number): string {
  if (count === 0) return "None";
  if (count < 0) return "Unlimited";
  return `${count} template${count === 1 ? "" : "s"}`;
}

/** One comparison row: a label and how to read it off a plan. */
const ROWS: { label: string; value: (p: PlanView) => string | boolean }[] = [
  { label: "Credits / week", value: (p) => amount(p.WeeklyCredits) },
  {
    label: "≈ Project READMEs / week",
    value: (p) => amount(p.ApproxProjectReadmes),
  },
  {
    label: "≈ Profile composes / week",
    value: (p) => amount(p.ApproxProfileComposes),
  },
  { label: "Repositories", value: () => "Unlimited" },
  { label: "Saved resumes", value: () => "Unlimited" },
  {
    label: "AI model tier",
    value: (p) => `${p.ModelTier[0].toUpperCase()}${p.ModelTier.slice(1)}`,
  },
  { label: "Private repos", value: (p) => p.PrivateRepos },
  {
    label: "Push mode",
    value: (p) => (p.DirectPush ? "PR or direct push" : "Manual / PR only"),
  },
  { label: "Bulk generation", value: (p) => p.BulkGenerate },
  { label: "Custom templates", value: (p) => templates(p.CustomTemplates) },
  {
    label: "History retention",
    value: (p) =>
      p.HistoryRetentionDays < 0 ? "Unlimited" : `${p.HistoryRetentionDays} days`,
  },
  { label: "Watermark", value: (p) => p.Watermark },
  { label: "Support", value: (p) => p.Support },
  { label: "API access", value: (p) => p.ApiAccess },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-emerald-500" />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

/** Full tier comparison — rendered entirely from GET /plans. */
export function ComparisonSection() {
  const { data: plans = [], isLoading } = usePublicPlans();

  return (
    <section className="px-4 pb-20 pt-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Separator className="mb-10" />
        <h2 className="mb-6 text-xl font-bold text-foreground">
          Full comparison
        </h2>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <Skeleton className="h-96 w-full rounded-3xl" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Feature
                      </th>
                      {plans.map((plan) => (
                        <th
                          key={plan.Tier}
                          className={`px-4 py-3 text-center font-semibold ${
                            plan.Highlight
                              ? "text-violet-600"
                              : "text-foreground"
                          }`}
                        >
                          {plan.Name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row, i) => (
                      <tr
                        key={row.label}
                        className={i % 2 !== 0 ? "bg-muted/30" : ""}
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.label}
                        </td>
                        {plans.map((plan) => (
                          <td key={plan.Tier} className="px-4 py-3 text-center">
                            <Cell value={row.value(plan)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
