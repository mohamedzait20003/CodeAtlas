import { ServerCrash } from "lucide-react";

import { useStore } from "@/store";
import { Card } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { PageIntro } from "@/modules/client/components/PageIntro";
import { EmptyState } from "@/modules/client/components/EmptyState";
import { ComposeActions } from "../sections/overview/ComposeActions";
import { PlanUsage } from "../sections/overview/PlanUsage";
import { RecentGenerations } from "../sections/overview/RecentGenerations";
import { GettingStarted } from "../sections/overview/GettingStarted";
import { Roadmap } from "../sections/overview/Roadmap";

export default function Overview() {
  const userData = useStore((s) => s.userData);
  const firstName =
    userData?.name?.split(" ")[0] ?? userData?.githubLogin ?? "there";

  const { data, isLoading, isError } = useDashboard();
  const failed = isError || !data;

  return (
    <div className="space-y-6">
      <PageIntro
        title={`Welcome back, ${firstName}`}
        description="Compose documentation from your code — here's your workspace."
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Primary: what you can do (now + soon) + what you've done */}
        <div className="space-y-6 lg:col-span-2">
          <ComposeActions />
          <Roadmap />
          {isLoading ? (
            <Skeleton className="h-64 rounded-3xl" />
          ) : failed ? null : (
            <RecentGenerations items={data.RecentGenerations} />
          )}
        </div>

        {/* Sidebar: plan/usage + onboarding */}
        <div className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-72 rounded-3xl" />
          ) : failed ? (
            <Card className="py-0">
              <EmptyState
                icon={ServerCrash}
                title="Couldn't load your usage"
                description="Something went wrong. Please try again in a moment."
              />
            </Card>
          ) : (
            <PlanUsage data={data} />
          )}
          <GettingStarted />
        </div>
      </div>
    </div>
  );
}
