import { PlanCard } from "../../components/PlanCard";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Get started with no commitment.",
    cta: "Start for free",
    highlight: false,
    popular: false,
    features: [
      "3 repos",
      "5 repo READMEs / month",
      "Compose Your Profile 1× / month",
      "1 saved resume",
      "Economy model",
      "Manual copy or PR",
    ],
  },
  {
    name: "Starter",
    price: "$9",
    period: "/mo",
    desc: "For developers who ship regularly.",
    cta: "Start Starter",
    highlight: true,
    popular: true,
    features: [
      "25 repos",
      "75 repo READMEs / month",
      "Compose Your Profile 4× / month",
      "5 saved resumes",
      "Standard model",
      "Auto PR",
      "Private repos",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    desc: "For teams and power users.",
    cta: "Start Pro",
    highlight: false,
    popular: false,
    features: [
      "Unlimited repos",
      "750 repo READMEs / month",
      "Unlimited Compose Your Profile",
      "Unlimited resumes",
      "Premium model",
      "Direct push",
      "Bulk generation",
      "API access",
    ],
  },
];

export function PricingCardsSection() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
