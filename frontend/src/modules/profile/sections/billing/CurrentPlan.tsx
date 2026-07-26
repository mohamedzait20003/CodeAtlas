import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Skeleton } from "@/common/components/ui/skeleton";
import { UsageMeter } from "@/modules/client/components/UsageMeter";
import { useDashboard } from "@/lib/hooks/useDashboard";

const PRICE: Record<string, string> = {
  free: "No cost — upgrade any time.",
  starter: "$9 / month",
  pro: "$29 / month",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CurrentPlan() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <Skeleton className="h-56 w-full rounded-3xl" />;
  }

  const { Plan, Usage } = data;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          {Plan.Name} plan
          <Badge variant="emerald">{Plan.Status}</Badge>
        </CardTitle>
        <CardDescription>{PRICE[Plan.Tier] ?? ""}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <UsageMeter
          label="Compose Your Profile this period"
          used={Usage.CompositionsUsed}
          limit={Usage.CompositionLimit}
        />
        <UsageMeter
          label="Repo READMEs this period"
          used={Usage.GenerationsUsed}
          limit={Usage.GenerationLimit}
        />
        <UsageMeter
          label="Repositories analyzed"
          used={Usage.ReposAnalyzed}
          limit={Usage.RepoLimit}
        />
      </CardContent>

      {Usage.PeriodEnd && (
        <CardFooter className="border-t text-sm text-muted-foreground">
          Usage resets on {formatDate(Usage.PeriodEnd)}.
        </CardFooter>
      )}
    </Card>
  );
}
