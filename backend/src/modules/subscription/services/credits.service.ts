import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { PlanTier } from '@/shared/Domain/enums/plan-tier.enum';
import {
  CREDIT_ACTION_LABELS,
  CREDIT_ESTIMATES,
  CreditAction,
} from '@/shared/Domain/enums/credit-action.enum';

/** Output tokens cost roughly this much more than input at every provider. */
const OUTPUT_WEIGHT = 4;
/** Weighted tokens per credit. */
const TOKENS_PER_CREDIT = 1_000;
/** A plan granting this many credits is unmetered. */
const UNLIMITED = -1;

export interface CreditBalance {
  /** Credits the plan grants each week (-1 = unlimited). */
  weeklyCredits: number;
  /** Settled this week. */
  used: number;
  /** Reserved by runs still in flight. */
  held: number;
  /** weeklyCredits − used − held, floored at 0 (unlimited reports -1). */
  remaining: number;
  /** Monday of the current credit week (ISO date). */
  weekStart: string;
  /** When the balance resets (next Monday 00:00 UTC). */
  weekResetsAt: string;
}

/**
 * Weekly credit accounting, priced in LLM tokens.
 *
 * A run's true cost isn't known until the model reports its usage, so credits
 * are spent in two steps: {@link hold} reserves a conservative estimate before
 * the job is queued, then {@link settle} (or {@link release} on failure) swaps
 * that hold for the real token cost. Balances are per week — a new week is
 * simply a new counter row, so unused credits expire with no scheduled job.
 */
@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(UsageCounter)
    private readonly usage: Repository<UsageCounter>,
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
  ) {}

  /**
   * Reserve the action's estimate. Throws 403 when the week's balance can't
   * cover it. Returns the amount held so the caller can record it on the run.
   */
  async hold(userId: string, action: CreditAction): Promise<number> {
    const estimate = CREDIT_ESTIMATES[action];
    const weekly = await this.weeklyAllowance(userId);

    // Fail closed: a mis-seeded plan must never silently grant free runs.
    if (weekly === undefined || weekly === null) {
      throw new ForbiddenException('Your plan has no credit allowance.');
    }

    const row = await this.weekRow(userId);

    if (weekly !== UNLIMITED) {
      if (weekly <= 0) {
        throw new ForbiddenException('Your plan has no credit allowance.');
      }
      const remaining = weekly - row.creditsUsed - row.creditsHeld;
      if (remaining < estimate) {
        throw new ForbiddenException(
          `${CREDIT_ACTION_LABELS[action]} needs about ${estimate} credits and you have ${Math.max(remaining, 0)} left this week. Your credits reset Monday.`,
        );
      }
    }

    row.creditsHeld += estimate;
    await this.usage.save(row);
    return estimate;
  }

  /**
   * Release the hold and charge what the run actually cost. Settles against the
   * week the run *started* in, which is where its hold lives.
   */
  async settle(
    userId: string,
    startedAt: Date,
    holdAmount: number,
    inputTokens: number | null,
    outputTokens: number | null,
  ): Promise<void> {
    const row = await this.weekRow(userId, startedAt);
    row.creditsHeld = Math.max(0, row.creditsHeld - holdAmount);
    row.creditsUsed += this.creditCost(inputTokens, outputTokens);
    await this.usage.save(row);
  }

  /** Give the hold back untouched — the run never produced anything. */
  async release(
    userId: string,
    startedAt: Date,
    holdAmount: number,
  ): Promise<void> {
    if (holdAmount <= 0) return;
    const row = await this.weekRow(userId, startedAt);
    row.creditsHeld = Math.max(0, row.creditsHeld - holdAmount);
    await this.usage.save(row);
  }

  /** This week's balance, for the dashboard. */
  async balance(userId: string): Promise<CreditBalance> {
    const weekly = (await this.weeklyAllowance(userId)) ?? 0;
    const weekStart = this.startOfWeekUtc(new Date());
    const row = await this.usage.findOne({
      where: { userId, periodStart: weekStart },
    });
    const used = row?.creditsUsed ?? 0;
    const held = row?.creditsHeld ?? 0;

    return {
      weeklyCredits: weekly,
      used,
      held,
      remaining:
        weekly === UNLIMITED ? UNLIMITED : Math.max(0, weekly - used - held),
      weekStart,
      weekResetsAt: this.nextWeekStartUtc(weekStart),
    };
  }

  /**
   * Credits for one run: output tokens are weighted because they cost several
   * times more than input. Rounded up, and any real usage costs at least 1.
   */
  creditCost(inputTokens: number | null, outputTokens: number | null): number {
    const input = Math.max(0, inputTokens ?? 0);
    const output = Math.max(0, outputTokens ?? 0);
    const weighted = input + OUTPUT_WEIGHT * output;
    if (weighted === 0) return 0;
    return Math.max(1, Math.ceil(weighted / TOKENS_PER_CREDIT));
  }

  /**
   * Credits the user's plan grants weekly. Resolved here (rather than through
   * PlansService) so the credit domain stays self-contained — the composition
   * workers need it without pulling in the billing/payment-gateway chain.
   */
  private async weeklyAllowance(userId: string): Promise<number | undefined> {
    const subscription = await this.subscriptions.findOne({
      where: { userId },
    });
    const plan =
      (subscription?.plan as Plan | undefined) ??
      (await this.plans.findOne({ where: { tier: PlanTier.FREE } }));
    return plan?.weeklyCredits;
  }

  /** The week's counter row, created on first use. */
  private async weekRow(userId: string, at?: Date): Promise<UsageCounter> {
    const periodStart = this.startOfWeekUtc(at ?? new Date());
    return (
      (await this.usage.findOne({ where: { userId, periodStart } })) ??
      this.usage.create({
        userId,
        periodStart,
        creditsUsed: 0,
        creditsHeld: 0,
      })
    );
  }

  /** Monday 00:00 UTC of `date`'s week, as the counter key (YYYY-MM-DD). */
  startOfWeekUtc(date: Date): string {
    const daysSinceMonday = (date.getUTCDay() + 6) % 7; // getUTCDay: 0 = Sunday
    const monday = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
    return monday.toISOString().slice(0, 10);
  }

  /** The Monday after `weekStart` — when this balance resets. */
  private nextWeekStartUtc(weekStart: string): string {
    const next = new Date(`${weekStart}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 7);
    return next.toISOString();
  }
}
