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
}
