import type { ApiResponse } from "./baseModel";

/** Response shapes for GET /analytics/dashboard (mirrors the backend DTO). */

export interface DashboardPlan {
  Tier: string;
  Name: string;
  Status: string;
  /** Set when the subscription is scheduled to end — access lasts until then. */
  EndsAt: string | null;
}

export interface DashboardUsage {
  /** "Compose Your Profile" runs used this period (enforced by the quota guard). */
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

export type DashboardResponse = ApiResponse<DashboardData>;
