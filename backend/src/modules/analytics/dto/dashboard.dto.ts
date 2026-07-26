/** Shapes returned by GET /analytics/dashboard (wrapped by ResponseInterceptor). */

export interface DashboardPlan {
  Tier: string;
  Name: string;
  Status: string;
}

export interface DashboardUsage {
  /** "Compose Your Profile" profile-README runs used this period (enforced by @Quota). */
  CompositionsUsed: number;
  /** -1 = unlimited. */
  CompositionLimit: number;
  GenerationsUsed: number;
  /** -1 = unlimited. */
  GenerationLimit: number;
  ReposAnalyzed: number;
  /** -1 = unlimited. */
  RepoLimit: number;
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
