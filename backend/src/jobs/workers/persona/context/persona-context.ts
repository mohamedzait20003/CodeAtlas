/** A repository summarised for the profile agent (metadata + README excerpt). */
export interface RepoContext {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  /** README text (truncated), or null when the repo has none. */
  readme: string | null;
}

/** Everything the agent reads to (re)write the profile README. */
export interface ProfileContext {
  githubLogin: string | null;
  githubConnected: boolean;
  /** Extracted résumé text (uploads) or a link note; null when there's no résumé. */
  resumeText: string | null;
  /** Current profile-repo README (owner/owner), or null if it doesn't exist yet. */
  profileReadme: string | null;
  repos: RepoContext[];
  /** Canonical, code-generated GitHub stat-widget embeds (correct URLs), or null
   * when GitHub isn't connected. The agent reproduces this verbatim — it never
   * constructs stat URLs itself. */
  statsEmbeds: string | null;
}
