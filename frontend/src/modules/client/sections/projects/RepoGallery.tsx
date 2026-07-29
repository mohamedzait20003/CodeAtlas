import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderGit2,
  Github,
  Loader2,
  Lock,
  PenLine,
  ServerCrash,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { cn } from "@/lib/utils/utils";
import { useStore } from "@/store";
import { useAccountName } from "@/lib/auth/account";
import { useRepos } from "@/lib/hooks/useRepos";
import { EmptyState } from "@/modules/client/components/EmptyState";
import type { RepoCompositionStatus } from "@/lib/models/repoModel";

function updated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Small chip summarising a repo's latest README composition. */
function StatusChip({ c }: { c?: RepoCompositionStatus | null }) {
  if (!c) {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        Not composed
      </span>
    );
  }
  if (c.Status === "queued" || c.Status === "running") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Composing…
      </span>
    );
  }
  if (c.Status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  if (c.CommitSha) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Committed · {updated(c.CreatedAt)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
      <PenLine className="h-3 w-3" />
      Draft ready
    </span>
  );
}

export function RepoGallery() {
  const linked = useStore((s) => s.userData?.githubLinked);
  const name = useAccountName();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isPlaceholderData } = useRepos(page);

  if (!linked) {
    return (
      <Card className="py-0">
        <EmptyState
          icon={Github}
          title="Connect GitHub to see your repositories"
          description="Once connected, your repositories appear here — ready to compose a README for any of them."
          action={
            <Button
              asChild
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              <Link to="/customer/$name/profile/settings" params={{ name }}>
                Connect GitHub
              </Link>
            </Button>
          }
        />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="py-0">
        <EmptyState
          icon={ServerCrash}
          title="Couldn't load repositories"
          description="We couldn't reach GitHub just now. Please try again in a moment."
        />
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (data.Total === 0) {
    return (
      <Card className="py-0">
        <EmptyState
          icon={FolderGit2}
          title="No repositories found"
          description="We didn't find any repositories on your GitHub account."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3",
          isPlaceholderData && "opacity-60",
        )}
      >
        {data.Items.map((repo) => (
          <Card key={repo.Id} className="flex h-full flex-col">
            <CardContent className="flex flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={repo.HtmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 font-semibold text-foreground hover:text-violet-600"
                >
                  <span className="truncate">{repo.Name}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                {repo.Private && (
                  <Badge variant="outline" className="shrink-0 gap-1">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {repo.Language && <span>{repo.Language}</span>}
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {repo.Stars}
                </span>
                <span>Updated {updated(repo.UpdatedAt)}</span>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <StatusChip c={repo.Composition} />
                <Button
                  asChild
                  size="sm"
                  className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
                >
                  <Link
                    to="/customer/$name/projects/$repoId"
                    params={{ name, repoId: repo.Id }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {repo.Composition ? "Recompose" : "Compose"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {data.Page} of {data.TotalPages} · {data.Total} repositories
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!data.HasPrev || isPlaceholderData}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!data.HasNext || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
