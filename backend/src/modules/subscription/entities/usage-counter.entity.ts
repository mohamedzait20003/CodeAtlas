import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Tracks generation count per user per billing period (one row per period). */
@Index(['userId', 'periodStart'], { unique: true })
@Entity({ name: 'usage_counters' })
export class UsageCounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne('UserProfile', 'usageCounters')
  @JoinColumn({ name: 'user_id' })
  profile: any;

  /**
   * Monday of the credit week, UTC (ISO date string, e.g. "2026-08-03"). The
   * weekly reset is implicit: a new week means a new row, so unused credits
   * simply expire — no scheduled job needed.
   */
  @Column({ type: 'date', name: 'period_start' })
  periodStart: string;

  /** Credits settled this week from actual LLM token usage. */
  @Column({ type: 'int', name: 'credits_used', default: 0 })
  creditsUsed: number;

  /** Credits held by runs that are queued or in flight, not yet settled. */
  @Column({ type: 'int', name: 'credits_held', default: 0 })
  creditsHeld: number;
}
