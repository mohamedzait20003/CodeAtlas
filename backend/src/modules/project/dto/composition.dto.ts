import type { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';

/** POST /repos/:id/generate result. */
export interface CompositionStartView {
  Id: string;
}

/** POST /repos/generations/:id/commit result — the pushed commit. */
export interface CommitView {
  CommitSha: string;
  HtmlUrl: string;
}

/** GET /repos/generations/:id — polled by the workspace until Status is terminal. */
export interface CompositionView {
  Id: string;
  Status: GenerationStatus;
  /** Fine-grained progress within a running job (null before it starts). */
  Phase: string | null;
  GeneratedMd: string | null;
  Model: string | null;
  Error: string | null;
  CreatedAt: string;
}
