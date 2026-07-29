import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
  Cpu,
  ExternalLink,
  FileSearch,
  Lock,
  PenLine,
  ServerCrash,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Card, CardContent } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Skeleton } from "@/common/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { useAccountName } from "@/lib/auth/account";
import { useAiModels } from "@/lib/hooks/useAiModels";
import { useRepo } from "@/lib/hooks/useRepos";
import {
  useCommitProjectComposition,
  useProjectComposition,
  useStartProjectComposition,
} from "@/lib/hooks/useProjectComposition";
import type { RepoBrief } from "@/lib/models/projectModel";
import {
  LENGTHS,
  PROJECT_TYPES,
  REPO_AUDIENCES,
  REPO_SECTIONS,
  TONES,
} from "@/lib/models/briefOptions";
import { EmptyState } from "@/modules/client/components/EmptyState";
import {
  PhaseProgress,
  type Step,
} from "@/modules/client/sections/compose/PhaseProgress";
import { ReadmeEditor } from "@/modules/client/sections/compose/ReadmeEditor";
import {
  ChipGroup,
  Field,
  OptionSelect,
} from "@/modules/client/sections/compose/BriefControls";

/** The project flow has no planning phase — read → write → review. */
const REPO_STEPS: Step[] = [
  {
    key: "gathering",
    label: "Reading the repository",
    detail:
      "Pulling the description, file tree, primary manifest, and current README.",
    icon: FileSearch,
  },
  {
    key: "drafting",
    label: "Writing the README",
    detail:
      "Drafting features, tech stack, and getting-started from the real code.",
    revisingLabel: "Revising the README",
    revisingDetail: "Applying the reviewer's feedback and rewriting.",
    icon: PenLine,
  },
  {
    key: "reviewing",
    label: "Reviewing & polishing",
    detail: "Checking every claim against the repository's actual content.",
    revisingLabel: "Re-reviewing the revision",
    revisingDetail: "Re-checking the revised draft for accuracy.",
    icon: ShieldCheck,
  },
];

export default function ProjectCompose() {
  const params = useParams({ strict: false }) as { repoId?: string };
  const repoId = params.repoId ?? null;
  const name = useAccountName();

  const { data: repo, isLoading: repoLoading, isError: repoError } =
    useRepo(repoId);

  const [brief, setBrief] = useState<RepoBrief>({});
  const [modelId, setModelId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [genId, setGenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [committedUrl, setCommittedUrl] = useState<string | null>(null);

  const { data: models = [] } = useAiModels();
  const start = useStartProjectComposition();
  const commit = useCommitProjectComposition();
  const { data: generation } = useProjectComposition(genId);

  const defaultModelId =
    models.find((m) => m.IsDefault)?.Id ?? models[0]?.Id ?? "";
  const chosenModel = modelId || defaultModelId;

  const status = generation?.Status;
  const running = Boolean(genId) && status !== "completed" && status !== "failed";
  const failed = status === "failed";
  const completed = status === "completed";

  const set = <K extends keyof RepoBrief>(k: K, v: RepoBrief[K]) =>
    setBrief((b) => ({ ...b, [k]: v }));

  const cleanBrief = (): RepoBrief | undefined => {
    const b: RepoBrief = {
      projectType: brief.projectType || undefined,
      audience: brief.audience || undefined,
      sections: brief.sections?.length ? brief.sections : undefined,
      demoUrl: brief.demoUrl?.trim() || undefined,
      docsUrl: brief.docsUrl?.trim() || undefined,
      packageUrl: brief.packageUrl?.trim() || undefined,
      tone: brief.tone || undefined,
      length: brief.length || undefined,
      emphasis: brief.emphasis?.trim() || undefined,
    };
    return Object.values(b).some((v) => v !== undefined) ? b : undefined;
  };

  const onStart = () => {
    if (!repoId) return;
    start.mutate(
      { repoId, brief: cleanBrief(), modelId: chosenModel || undefined },
      {
        onSuccess: (res) => {
          if (res.Data) {
            setDraft(null);
            setCommittedUrl(null);
            setGenId(res.Data.Id);
          }
        },
      },
    );
  };

  const onStartOver = () => {
    setGenId(null);
    setDraft(null);
    setCommittedUrl(null);
  };

  const onCommit = () => {
    if (!genId) return;
    const content = draft ?? generation?.GeneratedMd ?? "";
    if (!content.trim()) return;
    commit.mutate(
      { id: genId, content },
      { onSuccess: (res) => setCommittedUrl(res.Data?.HtmlUrl ?? null) },
    );
  };

  return (
    <div className="space-y-4">
      {/* Header — always shows a way back to the browser. */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-1 h-7 gap-1 px-2 text-muted-foreground"
          >
            <Link to="/customer/$name/projects" params={{ name }}>
              <ChevronLeft className="h-4 w-4" />
              Projects
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold text-foreground">
              {repo?.FullName ?? "Compose a README"}
            </h1>
            {repo?.Private && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
            {repo && (
              <a
                href={repo.HtmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-violet-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {repoLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : repoError || !repo ? (
        <Card className="py-0">
          <EmptyState
            icon={ServerCrash}
            title="Repository not found"
            description="We couldn't find that repository on your account."
            action={
              <Button asChild>
                <Link to="/customer/$name/projects" params={{ name }}>
                  Back to projects
                </Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Setup form (before a run starts). */}
          {!genId && (
            <Card className="overflow-hidden">
              <CardContent className="space-y-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  We read the repository's code, manifest, and current README,
                  then draft a project README grounded in what's actually there —
                  you review every word before it's committed. Everything below
                  is optional.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Project type">
                    <OptionSelect
                      value={brief.projectType}
                      onChange={(v) => set("projectType", v)}
                      options={PROJECT_TYPES}
                    />
                  </Field>
                  <Field label="Primary audience">
                    <OptionSelect
                      value={brief.audience}
                      onChange={(v) => set("audience", v)}
                      options={REPO_AUDIENCES}
                    />
                  </Field>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Anything to emphasize?{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    value={brief.emphasis ?? ""}
                    onChange={(e) => set("emphasis", e.target.value)}
                    placeholder={
                      'e.g. "Aimed at first-time contributors — highlight setup steps and the plugin architecture."'
                    }
                    className="min-h-20"
                  />
                </div>

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
                        label="Sections to include"
                        hint="(default: we decide)"
                      >
                        <ChipGroup
                          options={REPO_SECTIONS}
                          value={brief.sections ?? []}
                          onChange={(v) => set("sections", v)}
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
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Live demo URL">
                          <Input
                            value={brief.demoUrl ?? ""}
                            onChange={(e) => set("demoUrl", e.target.value)}
                            placeholder="https://…"
                          />
                        </Field>
                        <Field label="Docs URL">
                          <Input
                            value={brief.docsUrl ?? ""}
                            onChange={(e) => set("docsUrl", e.target.value)}
                            placeholder="https://…"
                          />
                        </Field>
                        <Field label="Package URL">
                          <Input
                            value={brief.packageUrl ?? ""}
                            onChange={(e) => set("packageUrl", e.target.value)}
                            placeholder="npm / PyPI / …"
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </div>

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
                    {start.isPending ? "Starting…" : "Compose the README"}
                  </Button>
                </div>

                {start.error && (
                  <p className="text-sm text-destructive">
                    {start.error.message}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {running && (
            <PhaseProgress
              phase={generation?.Phase ?? null}
              status={status ?? "queued"}
              model={generation?.Model ?? null}
              steps={REPO_STEPS}
              footnote="Nothing is pushed yet. When the draft is ready you'll review and edit every word before it's committed to the repository."
            />
          )}

          {failed && (
            <Card className="py-0">
              <EmptyState
                icon={ServerCrash}
                title="That didn't go through"
                description={
                  generation?.Error ?? "Something went wrong. Please try again."
                }
                action={<Button onClick={onStartOver}>Try again</Button>}
              />
            </Card>
          )}

          {completed && (
            <ReadmeEditor
              value={draft ?? generation?.GeneratedMd ?? ""}
              onChange={(v) => {
                setDraft(v);
                setCommittedUrl(null);
              }}
              model={generation?.Model ?? null}
              onStartOver={onStartOver}
              onCommit={onCommit}
              committing={commit.isPending}
              committedUrl={committedUrl}
              commitError={commit.error?.message ?? null}
            />
          )}
        </>
      )}
    </div>
  );
}
