import type { ApiResponse } from "./baseModel";

export type CompositionStatus = "queued" | "running" | "completed" | "failed";

/** A "Compose a README" job (mirrors the backend project CompositionView). */
export interface Composition {
  Id: string;
  Status: CompositionStatus;
  /** Fine-grained progress: gathering / drafting / reviewing / completed. */
  Phase: string | null;
  GeneratedMd: string | null;
  Model: string | null;
  Error: string | null;
  CreatedAt: string;
}

export interface CompositionStart {
  Id: string;
}

/** POST /repos/generations/:id/commit — the pushed commit. */
export interface Commit {
  CommitSha: string;
  HtmlUrl: string;
}

/** Structured steering for the project (repo) flow (all optional). */
export interface RepoBrief {
  projectType?: string;
  audience?: string;
  sections?: string[];
  demoUrl?: string;
  docsUrl?: string;
  packageUrl?: string;
  tone?: string;
  length?: string;
  emphasis?: string;
}

export type CompositionResponse = ApiResponse<Composition>;
export type CompositionStartResponse = ApiResponse<CompositionStart>;
export type CommitResponse = ApiResponse<Commit>;
