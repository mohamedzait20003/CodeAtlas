/** Credit-consuming actions, enforced by the @Credits decorator / CreditsGuard. */
export enum CreditAction {
  PROFILE_COMPOSITION = 'profile_composition',
  PROJECT_COMPOSITION = 'project_composition',
}

/**
 * Credits held up-front for an action. A run's real cost is only known once the
 * LLM reports its token usage, so we hold a conservative estimate at enqueue and
 * settle the difference on completion.
 *
 * Sized from observed runs: a project README is a 3-node agent over one repo; a
 * profile composition is a 5-node agent over the résumé plus every repository.
 */
export const CREDIT_ESTIMATES: Record<CreditAction, number> = {
  [CreditAction.PROFILE_COMPOSITION]: 70,
  [CreditAction.PROJECT_COMPOSITION]: 20,
};

/** Human-readable action names, used in the "not enough credits" message. */
export const CREDIT_ACTION_LABELS: Record<CreditAction, string> = {
  [CreditAction.PROFILE_COMPOSITION]: 'Compose Your Profile',
  [CreditAction.PROJECT_COMPOSITION]: 'Compose a README',
};
