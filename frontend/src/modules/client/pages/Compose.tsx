import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Cpu,
  Feather,
  Github,
  ServerCrash,
  Sparkles,
  Wand2,
} from "lucide-react";

import { PageIntro } from "@/modules/client/components/PageIntro";
import { EmptyState } from "@/modules/client/components/EmptyState";
import { Card, CardContent } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";

import { useStore } from "@/store";
import { useAccountName } from "@/lib/auth/account";
import {
  useCommitComposition,
  useComposition,
  useStartComposition,
  useTailorIntent,
} from "@/lib/hooks/useComposition";
import { useAiModels } from "@/lib/hooks/useAiModels";
import type { ProfileBrief } from "@/lib/models/compositionModel";
import {
  LENGTHS,
  PROFILE_AUDIENCES,
  PROFILE_SECTIONS,
  SENIORITIES,
  TONES,
} from "@/lib/models/briefOptions";
import { PhaseProgress } from "@/modules/client/sections/compose/PhaseProgress";
import { ReadmeEditor } from "@/modules/client/sections/compose/ReadmeEditor";
import {
  ChipGroup,
  Field,
  OptionSelect,
} from "@/modules/client/sections/compose/BriefControls";

export default function Compose() {
  const linked = useStore((s) => s.userData?.githubLinked);
  const name = useAccountName();
  const [brief, setBrief] = useState<ProfileBrief>({});
  const [modelId, setModelId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [committedUrl, setCommittedUrl] = useState<string | null>(null);

  const { data: models = [] } = useAiModels();
  const start = useStartComposition();
  const tailor = useTailorIntent();
  const commit = useCommitComposition();
  const { data: composition } = useComposition(jobId);

  const defaultModelId =
    models.find((m) => m.IsDefault)?.Id ?? models[0]?.Id ?? "";
  const chosenModel = modelId || defaultModelId;

  const status = composition?.Status;
  const hasJob = Boolean(jobId);
  const running = hasJob && status !== "completed" && status !== "failed";
  const failed = status === "failed";
  const completed = status === "completed";

  const set = <K extends keyof ProfileBrief>(k: K, v: ProfileBrief[K]) =>
    setBrief((b) => ({ ...b, [k]: v }));

  /** Trim to the fields the user actually set; undefined if the brief is empty. */
  const cleanBrief = (): ProfileBrief | undefined => {
    const b: ProfileBrief = {
      role: brief.role?.trim() || undefined,
      seniority: brief.seniority || undefined,
      audience: brief.audience || undefined,
      jobDescription: brief.jobDescription?.trim() || undefined,
      tone: brief.tone || undefined,
      length: brief.length || undefined,
      sections: brief.sections?.length ? brief.sections : undefined,
      emphasis: brief.emphasis?.trim() || undefined,
    };
    return Object.values(b).some((v) => v !== undefined) ? b : undefined;
  };

  const onStart = () =>
    start.mutate(
      { brief: cleanBrief(), modelId: chosenModel || undefined },
      {
        onSuccess: (res) => {
          if (res.Data) {
            setDraft(null);
            setCommittedUrl(null);
            setJobId(res.Data.Id);
          }
        },
      },
    );

  const onStartOver = () => {
    setJobId(null);
    setDraft(null);
    setCommittedUrl(null);
  };

  const onCommit = () => {
    if (!jobId) return;
    const content = draft ?? composition?.GeneratedMd ?? "";
    if (!content.trim()) return;
    commit.mutate(
      { id: jobId, content },
      { onSuccess: (res) => setCommittedUrl(res.Data?.HtmlUrl ?? null) },
    );
  };

  const onTailor = () => {
    const rough = brief.emphasis?.trim();
    if (!rough) return;
    tailor.mutate(rough, {
      onSuccess: (res) => {
        if (res.Data?.Text) set("emphasis", res.Data.Text);
      },
    });
  };

  if (!linked) {
    return (
      <div className="space-y-6">
        <PageIntro
          title="Compose Your Profile"
          description="Turn your repositories and résumé into a profile README that reads like you wrote it."
        />
        <Card className="py-0">
          <EmptyState
            icon={Github}
            title="Connect GitHub to get started"
            description="We read your repositories (and your résumé) to write your profile README, so GitHub needs to be connected first."
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Compose Your Profile"
        description="Turn your repositories and résumé into a profile README that reads like you wrote it — reviewed and committed on your terms."
      />

      {!hasJob && (
        <Card className="overflow-hidden">
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-violet-700 text-white shadow-sm">
                <Feather className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  Let's write your story
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Tell us who this is for and we'll design the README around it —
                  everything is optional, and you review every word before it
                  ships.
                </p>
              </div>
            </div>

            {/* Core targeting */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Target role" hint="(optional)">
                <Input
                  value={brief.role ?? ""}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="e.g. Backend Engineer"
                />
              </Field>
              <Field label="Seniority">
                <OptionSelect
                  value={brief.seniority}
                  onChange={(v) => set("seniority", v)}
                  options={SENIORITIES}
                />
              </Field>
              <Field label="Primary audience">
                <OptionSelect
                  value={brief.audience}
                  onChange={(v) => set("audience", v)}
                  options={PROFILE_AUDIENCES}
                />
              </Field>
            </div>

            {/* Emphasis (free-text escape hatch) + AI polish */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Anything you'd like to lead with?{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Textarea
                value={brief.emphasis ?? ""}
                onChange={(e) => set("emphasis", e.target.value)}
                placeholder={
                  'e.g. "Lead with my backend & AI-agent work — confident and recruiter-friendly."'
                }
                className="min-h-20"
              />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-violet-600 hover:text-violet-700"
                  onClick={onTailor}
                  disabled={!brief.emphasis?.trim() || tailor.isPending}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {tailor.isPending ? "Polishing…" : "Polish with AI"}
                </Button>
              </div>
            </div>

            {/* Advanced options */}
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showAdvanced ? "rotate-180" : ""
                  }`}
                />
                Advanced options
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <Field
                    label="Target job description"
                    hint="(paste one to tailor keywords & skills)"
                  >
                    <Textarea
                      value={brief.jobDescription ?? ""}
                      onChange={(e) => set("jobDescription", e.target.value)}
                      placeholder="Paste the JD you're targeting — we'll mirror its keywords where your résumé supports them."
                      className="min-h-24"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tone">
                      <OptionSelect
                        value={brief.tone}
                        onChange={(v) => set("tone", v)}
                        options={TONES}
                      />
                    </Field>
                    <Field label="Length">
                      <OptionSelect
                        value={brief.length}
                        onChange={(v) => set("length", v)}
                        options={LENGTHS}
                      />
                    </Field>
                  </div>
                  <Field label="Sections to include" hint="(default: we decide)">
                    <ChipGroup
                      options={PROFILE_SECTIONS}
                      value={brief.sections ?? []}
                      onChange={(v) => set("sections", v)}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Model + start */}
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Model</span>
                <Select
                  value={chosenModel}
                  onValueChange={setModelId}
                  disabled={models.length === 0}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.Id} value={m.Id}>
                        {m.Name}
                        {m.IsDefault ? " · default" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={onStart}
                disabled={start.isPending}
                className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
              >
                <Sparkles className="h-4 w-4" />
                {start.isPending ? "Starting…" : "Compose my README"}
              </Button>
            </div>

            {(start.error ?? tailor.error) && (
              <p className="text-sm text-destructive">
                {(start.error ?? tailor.error)?.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {running && (
        <PhaseProgress
          phase={composition?.Phase ?? null}
          status={status ?? "queued"}
          model={composition?.Model ?? null}
        />
      )}

      {failed && (
        <Card className="py-0">
          <EmptyState
            icon={ServerCrash}
            title="That didn't go through"
            description={
              composition?.Error ?? "Something went wrong. Please try again."
            }
            action={<Button onClick={onStartOver}>Try again</Button>}
          />
        </Card>
      )}

      {completed && (
        <ReadmeEditor
          value={draft ?? composition?.GeneratedMd ?? ""}
          onChange={(v) => {
            setDraft(v);
            setCommittedUrl(null);
          }}
          model={composition?.Model ?? null}
          onStartOver={onStartOver}
          onCommit={onCommit}
          committing={commit.isPending}
          committedUrl={committedUrl}
          commitError={commit.error?.message ?? null}
        />
      )}
    </div>
  );
}
