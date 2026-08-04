import { useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { UsageMeter } from "@/modules/client/components/UsageMeter";
import { useDashboard } from "@/lib/hooks/useDashboard";
import {
  useCancellationPreview,
  useCancelSubscription,
} from "@/lib/hooks/useBilling";

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

function money(minor: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);
}

export function CurrentPlan() {
  const { data, isLoading } = useDashboard();
  const [confirming, setConfirming] = useState(false);

  const { data: preview, isLoading: previewLoading } =
    useCancellationPreview(confirming);
  const cancel = useCancelSubscription();

  if (isLoading || !data) {
    return <Skeleton className="h-56 w-full rounded-3xl" />;
  }

  const { Plan, Usage } = data;
  const paid = Plan.Tier !== "free";
  const pastDue = Plan.Status === "past_due";
  const scheduledEnd = Plan.EndsAt ?? null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          {Plan.Name} plan
          <Badge variant={pastDue ? "destructive" : "emerald"}>
            {Plan.Status}
          </Badge>
        </CardTitle>
        <CardDescription>{PRICE[Plan.Tier] ?? ""}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {pastDue && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-foreground">
              Your last payment failed. We'll retry automatically — update your
              payment method to avoid losing access.
            </p>
          </div>
        )}

        {scheduledEnd && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-foreground">
              Cancelled — you keep {Plan.Name} access until{" "}
              <span className="font-medium">{formatDate(scheduledEnd)}</span>.
            </p>
          </div>
        )}

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

        {/* Cancel flow — always previews the exact outcome before applying. */}
        {paid && !scheduledEnd && (
          <div className="border-t border-border pt-4">
            {!confirming ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(true)}
              >
                Cancel subscription
              </Button>
            ) : (
              <div className="space-y-3">
                {previewLoading || !preview ? (
                  <Skeleton className="h-12 w-full rounded-lg" />
                ) : (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <p className="text-sm text-foreground">{preview.Reason}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Access ends{" "}
                      <span className="font-medium text-foreground">
                        {formatDate(preview.EffectiveEnd)}
                      </span>
                      {preview.RefundAmount > 0 && (
                        <>
                          {" · refund "}
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {money(preview.RefundAmount, preview.Currency)}
                          </span>
                        </>
                      )}
                      .
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancel.isPending || !preview}
                    onClick={() => cancel.mutate()}
                  >
                    {cancel.isPending ? "Cancelling…" : "Confirm cancellation"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancel.isPending}
                    onClick={() => setConfirming(false)}
                  >
                    Keep my plan
                  </Button>
                </div>
                {cancel.error && (
                  <p className="text-sm text-destructive">
                    {cancel.error.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {Usage.PeriodEnd && (
        <CardFooter className="border-t text-sm text-muted-foreground">
          Usage resets on {formatDate(Usage.PeriodEnd)}.
        </CardFooter>
      )}
    </Card>
  );
}
