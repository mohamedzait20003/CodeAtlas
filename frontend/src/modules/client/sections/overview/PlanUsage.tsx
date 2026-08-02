import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/common/components/ui/card";
import { UsageMeter } from "@/modules/client/components/UsageMeter";
import { useAccountName } from "@/lib/auth/account";
import type { DashboardData } from "@/lib/models/dashboardModel";

function renewDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Plan + the period's metered usage, grouped in one card. */
export function PlanUsage({ data }: { data: DashboardData }) {
  const name = useAccountName();
  const { Plan, Usage, GithubLinked } = data;
  const renews = renewDate(Usage.PeriodEnd);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Plan &amp; usage</CardTitle>
        <CardAction>
          <Link
            to="/customer/$name/profile/billing"
            params={{ name }}
            className="text-sm font-medium text-violet-600 hover:underline"
          >
            {Plan.Name}
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageMeter
          label="Repositories"
          used={Usage.ReposAnalyzed}
          limit={Usage.RepoLimit}
        />
        <UsageMeter
          label="Project READMEs"
          used={Usage.GenerationsUsed}
          limit={Usage.GenerationLimit}
        />
        <UsageMeter
          label="Profile composes"
          used={Usage.CompositionsUsed}
          limit={Usage.CompositionLimit}
        />
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            {GithubLinked ? "GitHub connected" : "GitHub not linked"}
          </span>
          <span className="capitalize">
            {renews ? `Renews ${renews}` : Plan.Status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
