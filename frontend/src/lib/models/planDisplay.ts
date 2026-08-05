import type { PlanView } from "./billingModel";

/** "∞" for unlimited (-1), otherwise a thousands-separated number. */
export function amount(value: number): string {
  return value < 0 ? "∞" : value.toLocaleString();
}

/** Dollar price for an interval, falling back to the monthly list price. */
export function priceFor(
  plan: PlanView,
  interval: "month" | "year",
): { label: string; period: string } {
  if (plan.PriceMonthly === 0 && plan.Prices.length === 0) {
    return { label: "$0", period: "" };
  }
  const price = plan.Prices.find((p) => p.Interval === interval);
  const period = interval === "month" ? "/mo" : "/yr";
  if (price) return { label: `$${Math.round(price.Amount / 100)}`, period };
  return { label: `$${Math.round(plan.PriceMonthly / 100)}`, period: "/mo" };
}

/**
 * The bullet list for a plan card, derived from the API's structured fields so
 * the copy can't drift from what the backend actually enforces.
 */
export function featureBullets(plan: PlanView): string[] {
  const bullets = [
    `${amount(plan.WeeklyCredits)} credits / week`,
    `≈ ${amount(plan.ApproxProjectReadmes)} project READMEs or ${amount(
      plan.ApproxProfileComposes,
    )} profiles`,
    "Unlimited repositories & resumes",
    `${plan.ModelTier[0].toUpperCase()}${plan.ModelTier.slice(1)} AI model`,
  ];
  if (plan.PrivateRepos) bullets.push("Private repos");
  if (plan.DirectPush) bullets.push("Direct-to-branch push");
  if (plan.BulkGenerate) bullets.push("Bulk generation");
  if (plan.CustomTemplates !== 0) {
    bullets.push(
      plan.CustomTemplates < 0
        ? "Unlimited custom templates"
        : `${plan.CustomTemplates} custom template${plan.CustomTemplates === 1 ? "" : "s"}`,
    );
  }
  if (plan.ApiAccess) bullets.push("API access");
  return bullets;
}
