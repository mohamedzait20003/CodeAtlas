import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/common/components/ui/card";
import type { DashboardGeneration } from "@/lib/models/dashboardModel";
import { useAccountName } from "@/lib/auth/account";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "@/modules/client/components/EmptyState";
import type { GenerationStatus } from "../../placeholder";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function RecentGenerations({
  items,
}: {
  items: DashboardGeneration[];
}) {
  const recent = items.slice(0, 4);
  const name = useAccountName();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Recent generations</CardTitle>
        <CardAction>
          <Link
            to="/customer/$name/projects"
            params={{ name }}
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {recent.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nothing generated yet"
            description="Your README generations will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((g) => (
              <li
                key={g.Id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {g.Repo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(g.CreatedAt)}
                  </p>
                </div>
                <StatusBadge status={g.Status as GenerationStatus} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
