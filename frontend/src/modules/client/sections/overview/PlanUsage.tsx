import { Link } from "@tanstack/react-router";
import { Github, Loader2 } from "lucide-react";

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

function resetDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Plan + this week's credit balance, grouped in one card. */
export function PlanUsage({ data }: { data: DashboardData }) {
  const name = useAccountName();
  const { Plan, Usage, GithubLinked } = data;
  const unlimited = Usage.WeeklyCredits < 0;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Plan &amp; credits</CardTitle>
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
          label="Credits this week"
          used={Usage.CreditsUsed}
          limit={Usage.WeeklyCredits}
        />

        <p className="text-xs text-muted-foreground">
          {unlimited
            ? "Unlimited credits on your plan."
            : `${Usage.CreditsRemaining} credits left — enough for about ${Math.floor(
                Usage.CreditsRemaining / 20,
              )} project README${
                Math.floor(Usage.CreditsRemaining / 20) === 1 ? "" : "s"
              }.`}
        </p>

        {Usage.CreditsHeld > 0 && (
          <p className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            {Usage.CreditsHeld} credits reserved by a run in progress
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            {GithubLinked ? "GitHub connected" : "GitHub not linked"}
          </span>
          <span>Resets {resetDate(Usage.CreditsResetAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
