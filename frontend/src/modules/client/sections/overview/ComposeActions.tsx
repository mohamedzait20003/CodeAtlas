import { Link } from "@tanstack/react-router";
import { ArrowRight, FolderGit2, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/common/components/ui/card";
import { useAccountName } from "@/lib/auth/account";

type Action = {
  title: string;
  description: string;
  icon: LucideIcon;
  to: "/customer/$name/compose" | "/customer/$name/projects";
  cta: string;
};

const ACTIONS: Action[] = [
  {
    title: "Compose your profile",
    description: "A GitHub profile README from your résumé and every repository.",
    icon: UserRound,
    to: "/customer/$name/compose",
    cta: "Start",
  },
  {
    title: "Document a project",
    description: "A grounded README for any repository — reviewed before it ships.",
    icon: FolderGit2,
    to: "/customer/$name/projects",
    cta: "Browse repositories",
  },
];

/** The two live capabilities, as the dashboard's primary calls to action. */
export function ComposeActions() {
  const name = useAccountName();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <Link key={a.title} to={a.to} params={{ name }} className="group block">
            <Card className="h-full transition-colors group-hover:border-violet-400 dark:group-hover:border-violet-600">
              <CardContent className="flex h-full flex-col gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-violet-700 text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400">
                  {a.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
