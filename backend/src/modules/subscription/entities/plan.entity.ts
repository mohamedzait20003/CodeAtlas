import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ModelTier } from '@/shared/Domain/enums/model-tier.enum';
import { PlanTier } from '@/shared/Domain/enums/plan-tier.enum';
import type { PlanFeatures } from '@/shared/Domain/interfaces/plan-features.interface';

/** Subscription plan definition. Tunable via DB without a redeploy. */
@Entity({ name: 'plans' })
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PlanTier, unique: true })
  tier: PlanTier;

  /** Display name shown on the pricing + billing pages. */
  @Column({ type: 'text' })
  name: string;

  /** One-line pitch under the price on the marketing card. */
  @Column({ type: 'text', default: '' })
  description: string;

  /** Call-to-action label on the marketing card. */
  @Column({ type: 'text', name: 'cta_label', default: 'Get started' })
  ctaLabel: string;

  /** Renders as the highlighted "Most popular" column. */
  @Column({ type: 'boolean', default: false })
  highlight: boolean;

  /** Ascending display order on the pricing pages. */
  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  /** Price in cents. */
  @Column({ type: 'int', name: 'price_monthly', default: 0 })
  priceMonthly: number;

  /**
   * Credits granted each week (resets Monday 00:00 UTC, unused credits expire).
   * One credit ≈ 1k weighted LLM tokens — see `CreditsService.creditCost`.
   * -1 = unlimited.
   */
  @Column({ type: 'int', name: 'weekly_credits', default: 300 })
  weeklyCredits: number;

  @Column({
    type: 'enum',
    enum: ModelTier,
    name: 'model_tier',
    default: ModelTier.ECONOMY,
  })
  modelTier: ModelTier;

  /**
   * Concrete provider model id resolved by LlmProviderFactory (Commit 5).
   * Example: "claude-haiku-4-5-20251001" or "gpt-4o-mini".
   */
  @Column({ type: 'text' })
  model: string;

  @Column({ type: 'jsonb' })
  features: PlanFeatures;

  @OneToMany('Subscription', 'plan')
  subscriptions: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
