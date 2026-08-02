import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/common/components/ui/card";
import { useStore } from "@/store";
import { cn } from "@/lib/utils/utils";
import { useAccountName } from "@/lib/auth/account";

type CustomerTo =
  | "/customer/$name/profile/settings"
  | "/customer/$name/profile/resume"
  | "/customer/$name/projects";

interface Step {
  title: string;
  description: string;
  done: boolean;
  to: CustomerTo;
  cta: string;
}

export function GettingStarted() {
  const userData = useStore((s) => s.userData);
  const name = useAccountName();

  const steps: Step[] = [
    {
      title: "Connect GitHub",
      description: "Link your account so we can read your repositories.",
      done: Boolean(userData?.githubLinked),
      to: "/customer/$name/profile/settings",
      cta: "Connect",
    },
    {
      title: "Upload your resume",
      description: "Give the AI context so the writing matches your skills.",
      done: false,
      to: "/customer/$name/profile/resume",
      cta: "Upload",
    },
    {
      title: "Generate a README",
      description: "Pick a repository and open your first pull request.",
      done: false,
      to: "/customer/$name/projects",
      cta: "Generate",
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting started</CardTitle>
        <CardDescription>
          {completed} of {steps.length} steps complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex items-start gap-3 rounded-lg px-2 py-2.5"
          >
            {step.done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.done
                    ? "text-muted-foreground line-through"
                    : "text-foreground",
                )}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {!step.done && (
              <Link
                to={step.to}
                params={{ name }}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
              >
                {step.cta}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
