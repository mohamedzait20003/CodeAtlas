/** Shapes returned by GET /analytics/dashboard (wrapped by ResponseInterceptor). */

export interface DashboardPlan {
  Tier: string;
  Name: string;
  Status: string;
  /** Set when the subscription is scheduled to end — access lasts until then. */
  EndsAt: string | null;
}

export interface DashboardUsage {
  /** Credits the plan grants each week. -1 = unlimited. */
  WeeklyCredits: number;
  /** Settled from actual LLM token usage this week. */
  CreditsUsed: number;
  /** Reserved by runs still in flight. */
  CreditsHeld: number;
  /** WeeklyCredits − used − held, floored at 0 (-1 when unlimited). */
  CreditsRemaining: number;
  /** When the weekly balance resets (next Monday 00:00 UTC). */
  CreditsResetAt: string;
  /** Informational — repositories are no longer capped. */
  ReposAnalyzed: number;
  /** End of the paid subscription period, when there is one. */
  PeriodEnd: string | null;
}

export interface DashboardGeneration {
  Id: string;
  Repo: string;
  Status: string;
  Model: string | null;
  PushMode: string;
  PrUrl: string | null;
  CreatedAt: string;
}

export interface DashboardData {
  GithubLinked: boolean;
  Plan: DashboardPlan;
  Usage: DashboardUsage;
  RecentGenerations: DashboardGeneration[];
}
