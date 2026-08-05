/**
 * Tier gates that aren't metered. Anything consumable is paid for out of the
 * plan's weekly credits (`Plan.weeklyCredits`), not counted here.
 */
export interface PlanFeatures {
  privateRepos: boolean;
  bulkGenerate: boolean;
  directPush: boolean;
  watermark: boolean;
  /** 0 = none, -1 = unlimited */
  customTemplates: number;
  /** Support level shown in the comparison table (e.g. "Community", "Email"). */
  support: string;
  /** Days to retain generation history. -1 = unlimited */
  historyRetentionDays: number;
  apiAccess: boolean;
}
