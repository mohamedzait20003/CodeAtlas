import type { ApiResponse } from "./baseModel";

export type CompositionStatus = "queued" | "running" | "completed" | "failed";

/** A "Compose Your Profile" job (mirrors the backend CompositionView). */
export interface Composition {
  Id: string;
  Status: CompositionStatus;
  /** Fine-grained progress: gathering / analyzing / drafting / reviewing / completed. */
  Phase: string | null;
  GeneratedMd: string | null;
  Model: string | null;
  Error: string | null;
  CreatedAt: string;
}

export interface CompositionStart {
  Id: string;
}

/** Structured steering for the persona (profile) flow (all optional). */
export interface ProfileBrief {
  role?: string;
  seniority?: string;
  audience?: string;
  jobDescription?: string;
  tone?: string;
  length?: string;
  sections?: string[];
  emphasis?: string;
}

/** POST /compositions/tailor — the sharpened steering instruction. */
export interface Tailor {
  Text: string;
}

/** POST /compositions/:id/commit — the pushed commit. */
export interface Commit {
  CommitSha: string;
  HtmlUrl: string;
}

export type CompositionResponse = ApiResponse<Composition>;
export type CompositionStartResponse = ApiResponse<CompositionStart>;
export type TailorResponse = ApiResponse<Tailor>;
export type CommitResponse = ApiResponse<Commit>;
