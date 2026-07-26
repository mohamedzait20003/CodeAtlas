import { Check, Minus } from "lucide-react";
import { Card, CardContent } from "@/common/components/ui/card";
import { Separator } from "@/common/components/ui/separator";

const PLANS = [
  {
    name: "Free",
    highlight: false,
    features: {
      repos: "3",
      readmeGenerations: "5 / month",
      compositions: "1 / month",
      resumes: "1",
      model: "Economy",
      privateRepos: false,
      pushMode: "Manual / PR only",
      bulkGenerate: false,
      customTemplates: "None",
      history: "7 days",
      watermark: true,
      support: "Community",
      apiAccess: false,
    },
  },
  {
    name: "Starter",
    highlight: true,
    features: {
      repos: "25",
      readmeGenerations: "75 / month",
      compositions: "4 / month",
      resumes: "5",
      model: "Standard",
      privateRepos: true,
      pushMode: "PR auto-open",
      bulkGenerate: false,
      customTemplates: "1 template",
      history: "90 days",
      watermark: false,
      support: "Email",
      apiAccess: false,
    },
  },
  {
    name: "Pro",
    highlight: false,
    features: {
      repos: "Unlimited",
      readmeGenerations: "750 / month",
      compositions: "Unlimited",
      resumes: "Unlimited",
      model: "Premium",
      privateRepos: true,
      pushMode: "PR or direct push",
      bulkGenerate: true,
      customTemplates: "Unlimited",
      history: "Unlimited",
      watermark: false,
      support: "Priority",
      apiAccess: true,
    },
  },
] as const;

const ROWS: { label: string; key: keyof (typeof PLANS)[0]["features"] }[] = [
  { label: "Repositories", key: "repos" },
  { label: "Repo READMEs / month", key: "readmeGenerations" },
  { label: "Compose Your Profile / month", key: "compositions" },
  { label: "Saved resumes", key: "resumes" },
  { label: "AI model tier", key: "model" },
  { label: "Private repos", key: "privateRepos" },
  { label: "Push mode", key: "pushMode" },
  { label: "Bulk generation", key: "bulkGenerate" },
  { label: "Custom templates", key: "customTemplates" },
  { label: "History retention", key: "history" },
  { label: "Watermark", key: "watermark" },
  { label: "Support", key: "support" },
  { label: "API access", key: "apiAccess" },
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

export function ComparisonSection() {
  return (
    <section className="px-4 pb-20 pt-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Separator className="mb-10" />
        <h2 className="mb-6 text-xl font-bold text-foreground">Full comparison</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Feature</th>
                    {PLANS.map(({ name, highlight }) => (
                      <th
                        key={name}
                        className={`px-4 py-3 text-center font-semibold ${
                          highlight ? "text-violet-600" : "text-foreground"
                        }`}
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(({ label, key }, i) => (
                    <tr key={key} className={i % 2 !== 0 ? "bg-muted/30" : ""}>
                      <td className="px-4 py-3 text-muted-foreground">{label}</td>
                      {PLANS.map(({ name, features }) => (
                        <td key={name} className="px-4 py-3 text-center">
                          <Cell value={features[key] as string | boolean} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
