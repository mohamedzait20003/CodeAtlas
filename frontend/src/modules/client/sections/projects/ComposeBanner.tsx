import { Sparkles, Feather } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Card, CardContent } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { useAccountName } from "@/lib/auth/account";

/**
 * Prominent action above the repo list: read all repos + resume to (re)write the
 * profile README (the owner/owner repo). Opens the Compose Your Profile workspace.
 */
export function ComposeBanner() {
  const name = useAccountName();

  return (
    <Card className="border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Feather className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-violet-900 dark:text-violet-100">
              Compose Your Profile
            </p>
            <p className="text-sm text-violet-800/80 dark:text-violet-200/80">
              Read all your repositories and your resume to write your profile
              README.
            </p>
          </div>
        </div>
        <Button
          asChild
          className="shrink-0 gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
        >
          <Link to="/customer/$name/compose" params={{ name }}>
            <Sparkles className="h-4 w-4" />
            Compose Your Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
