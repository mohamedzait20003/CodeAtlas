import type { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';

/** The latest README composition for a repo (null when never composed). */
export interface RepoCompositionStatus {
  Id: string;
  Status: GenerationStatus;
  CommitSha: string | null;
  CreatedAt: string;
}

/** A GitHub repository as returned to the client (subset of the GitHub API). */
export interface RepoItem {
  Id: string;
  Name: string;
  FullName: string;
  Private: boolean;
  DefaultBranch: string;
  Language: string | null;
  Stars: number;
  UpdatedAt: string;
  HtmlUrl: string;
  /** Latest README composition for this repo, or null if never composed. */
  Composition?: RepoCompositionStatus | null;
}
