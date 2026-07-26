export enum GenerationKind {
  /** Per-repo README generation — "Compose a README" (targets one repository). */
  REPO_README = 'repo_readme',
  /** Profile README from all repos + résumé — "Compose Your Profile" (no single repo). */
  PROFILE = 'profile',
}
