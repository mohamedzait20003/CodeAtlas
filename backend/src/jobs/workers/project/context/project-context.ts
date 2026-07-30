/** Everything the repo-README agent reads about one target repository. */
export interface RepoReadmeContext {
  fullName: string;
  description: string | null;
  /** Primary languages, most-used first. */
  languages: string[];
  /** Top-level entries in the repo (files + dirs). */
  fileTree: string[];
  /** The primary manifest (package.json, pyproject.toml, …), truncated. */
  manifest: string | null;
  /** The repo's current README, truncated (null when there is none). */
  readme: string | null;
}
