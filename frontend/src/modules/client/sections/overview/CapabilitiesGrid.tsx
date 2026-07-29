import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bug,
  Copy,
  FileText,
  FolderGit2,
  Gauge,
  Network,
  UserRound,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { cn } from "@/lib/utils/utils";
import { useAccountName } from "@/lib/auth/account";

type LiveTo = "/customer/$name/compose" | "/customer/$name/projects";

type Capability = {
  title: string;
  description: string;
  icon: LucideIcon;
  live: boolean;
  to?: LiveTo;
};

const CAPABILITIES: Capability[] = [
  {
    title: "Profile README",
    description:
      "Compose a GitHub profile README from your résumé and every repo.",
    icon: UserRound,
    live: true,
    to: "/customer/$name/compose",
  },
  {
    title: "Project READMEs",
    description: "Generate a grounded README for any repository, on your terms.",
    icon: FolderGit2,
    live: true,
    to: "/customer/$name/projects",
  },
  {
    title: "Explain Architecture",
    description: "Map how a codebase fits together — modules, flows, boundaries.",
    icon: Network,
    live: false,
  },
  {
    title: "Document Code",
    description: "Draft docstrings and reference docs from the source itself.",
    icon: FileText,
    live: false,
  },
  {
    title: "Detect Bugs",
    description: "Surface likely defects and risky patterns before they ship.",
    icon: Bug,
    live: false,
  },
  {
    title: "Find Duplicate Code",
    description: "Spot copy-paste and near-duplicate logic across the repo.",
    icon: Copy,
    live: false,
  },
  {
    title: "Suggest Refactoring",
    description: "Get concrete, safe refactors that simplify the code.",
    icon: Wand2,
    live: false,
  },
  {
    title: "Estimate Tech Debt",
    description: "Quantify hotspots and where maintenance cost concentrates.",
    icon: Gauge,
    live: false,
  },
];

export function CapabilitiesGrid() {
  const name = useAccountName();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Capabilities</h2>
        <span className="text-xs text-muted-foreground">
          More coming to CodeAtlas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c) => {
          const Icon = c.icon;
          const card = (
            <Card
              className={cn(
                "h-full transition-colors",
                c.live
                  ? "hover:border-violet-400 dark:hover:border-violet-600"
                  : "opacity-70",
              )}
            >
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      c.live
                        ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {c.live ? (
                    <Badge variant="emerald">Live</Badge>
                  ) : (
                    <Badge variant="outline">Soon</Badge>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{c.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                </div>
                {c.live && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </CardContent>
            </Card>
          );

          return c.live && c.to ? (
            <Link key={c.title} to={c.to} params={{ name }} className="block">
              {card}
            </Link>
          ) : (
            <div key={c.title} aria-disabled>
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
}
