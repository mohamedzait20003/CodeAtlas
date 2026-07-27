import { useRef } from "react";
import {
  Check,
  Cpu,
  FileSearch,
  ListChecks,
  Loader2,
  PenLine,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/common/components/ui/card";
import { Progress } from "@/common/components/ui/progress";
import type { CompositionStatus } from "@/lib/models/personaModel";

export type Step = {
  key: string;
  label: string;
  detail: string;
  /** Shown instead of `label`/`detail` while the draft↔review loop is revising. */
  revisingLabel?: string;
  revisingDetail?: string;
  icon: LucideIcon;
};

const STEPS: Step[] = [
  {
    key: "gathering",
    label: "Reading your material",
    detail: "Pulling in your résumé, profile README, and public repositories.",
    icon: FileSearch,
  },
  {
    key: "analyzing",
    label: "Planning the sections",
    detail: "Designing the structure for your target role and reader.",
    icon: ListChecks,
  },
  {
    key: "drafting",
    label: "Writing your README",
    detail: "Drafting the copy in your voice, section by section.",
    revisingLabel: "Revising your README",
    revisingDetail: "Applying the reviewer's feedback and rewriting.",
    icon: PenLine,
  },
  {
    key: "reviewing",
    label: "Reviewing & polishing",
    detail: "Self-checking for accuracy, completeness, and tone.",
    revisingLabel: "Re-reviewing the revision",
    revisingDetail: "Re-checking the revised draft against the plan.",
    icon: ShieldCheck,
  },
];

export function PhaseProgress({
  phase,
  status,
  model,
  steps = STEPS,
  footnote = "Nothing is published yet. When the draft is ready you'll review and edit every word before it's committed to your profile.",
}: {
  phase: string | null;
  status: CompositionStatus;
  model?: string | null;
  /** Step list for this flow (defaults to the 4-step profile pipeline). */
  steps?: Step[];
  /** Reassurance line shown under the timeline. */
  footnote?: string;
}) {
  const found = steps.findIndex((s) => s.key === phase);
  const starting =
    status === "queued" || !phase || phase === "queued" || found === -1;
  const current = starting ? 0 : found;

  // Per-job memory across polls. Refs persist between renders and reset when the
  // component remounts for a new job; guarded on phase changes so they update
  // once per transition, not on every render.
  const prevPhase = useRef<string | null>(null);
  const sawReview = useRef(false);
  const round = useRef(1); // 1 = first pass; >1 = a review→draft loop-back happened
  const maxPct = useRef(0);

  if (phase !== prevPhase.current) {
    if (phase === "reviewing") {
      sawReview.current = true;
    } else if (phase === "drafting" && sawReview.current) {
      round.current += 1; // the reviewer sent it back for another pass
      sawReview.current = false;
    }
    prevPhase.current = phase ?? null;
  }

  const revising = round.current > 1;
  const stepNumber = starting ? 1 : Math.min(current + 1, steps.length);

  // Progress never moves backward, even when the loop returns to drafting.
  const rawPct = starting
    ? 6
    : Math.round(((current + 0.5) / steps.length) * 100);
  maxPct.current = Math.max(maxPct.current, rawPct);
  const pct = maxPct.current;

  const title = starting
    ? "Getting started…"
    : revising
      ? "Polishing your README"
      : "Writing your README";
  const subtitle = revising
    ? "The reviewer asked for changes — drafting an improved version."
    : "This usually takes 30–90 seconds — you can stay on this page.";

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10">
              {revising ? (
                <RotateCw className="h-5 w-5 animate-spin" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            {model && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                {model}
              </span>
            )}
            {revising ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                <RotateCw className="h-3.5 w-3.5" />
                Revision {round.current - 1}
              </span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                Step {stepNumber} of {steps.length}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar — monotonic, never regresses on a loop-back */}
        <Progress value={pct} className="h-1.5" />

        {/* Timeline */}
        <ol>
          {steps.map((s, i) => {
            const done = !starting && i < current;
            const active = i === current;
            const last = i === steps.length - 1;
            const loopStep =
              revising && (s.key === "drafting" || s.key === "reviewing");
            const label = loopStep && s.revisingLabel ? s.revisingLabel : s.label;
            const detail =
              loopStep && s.revisingDetail ? s.revisingDetail : s.detail;
            const StepIcon = s.icon;

            return (
              <li key={s.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-violet-600 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : active ? (
                      loopStep ? (
                        <RotateCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </span>
                  {!last && (
                    <span
                      className={`my-1 w-px flex-1 transition-colors ${
                        done ? "bg-emerald-500/60" : "bg-border"
                      }`}
                    />
                  )}
                </div>

                <div className={last ? "pb-0" : "pb-6"}>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        done || active
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </p>
                    {done && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Done
                      </span>
                    )}
                    {active && !starting && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-600 dark:bg-violet-400" />
                        {loopStep ? "Revising" : "In progress"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Reassurance footer */}
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {footnote}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
