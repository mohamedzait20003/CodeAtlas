import type { ApiResponse } from "./baseModel";
import type { PagedResult } from "./pagedResult";
import type { CompositionStatus } from "./projectModel";

/** The latest README composition for a repo (null when never composed). */
export interface RepoCompositionStatus {
  Id: string;
  Status: CompositionStatus;
  CommitSha: string | null;
  CreatedAt: string;
}

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

export type ReposResponse = ApiResponse<PagedResult<RepoItem>>;
export type RepoResponse = ApiResponse<RepoItem>;
