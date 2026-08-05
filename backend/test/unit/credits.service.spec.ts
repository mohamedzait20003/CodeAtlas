import { ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { CreditsService } from '@/modules/subscription/services/credits.service';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { CreditAction } from '@/shared/Domain/enums/credit-action.enum';

const utc = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d));

/**
 * In-memory stand-ins: one counter row per (user, week) and a fixed plan, so
 * the arithmetic is exercised without a database.
 */
function makeService(weeklyCredits: number) {
  const rows: UsageCounter[] = [];

  const usage = {
    findOne: ({ where }: { where: { userId: string; periodStart: string } }) =>
      Promise.resolve(
        rows.find(
          (r) =>
            r.userId === where.userId && r.periodStart === where.periodStart,
        ) ?? null,
      ),
    create: (data: Partial<UsageCounter>) => data as UsageCounter,
    save: (row: UsageCounter) => {
      if (!rows.includes(row)) rows.push(row);
      return Promise.resolve(row);
    },
  } as unknown as Repository<UsageCounter>;

  const subscriptions = {
    findOne: () => Promise.resolve(null),
  } as unknown as Repository<Subscription>;

  const plans = {
    findOne: () => Promise.resolve({ weeklyCredits } as Plan),
  } as unknown as Repository<Plan>;

  const service = new CreditsService(usage, subscriptions, plans);

  /** Pre-load this week's counter row, so balance tests start mid-week. */
  const seedThisWeek = (used: number, held: number) => {
    rows.push({
      userId: 'u1',
      periodStart: service.startOfWeekUtc(new Date()),
      creditsUsed: used,
      creditsHeld: held,
    } as UsageCounter);
  };

  return { service, rows, seedThisWeek };
}

describe('CreditsService', () => {
  describe('creditCost', () => {
    const { service } = makeService(300);

    it('weights output tokens 4× and rounds up per 1k', () => {
      // 12,000 + 4×2,000 = 20,000 → 20 credits
      expect(service.creditCost(12_000, 2_000)).toBe(20);
      // 50,000 + 4×4,000 = 66,000 → 66 credits
      expect(service.creditCost(50_000, 4_000)).toBe(66);
    });

    it('rounds any partial thousand up', () => {
      expect(service.creditCost(1, 0)).toBe(1);
      expect(service.creditCost(1_001, 0)).toBe(2);
    });

    it('costs nothing when the run reported no usage', () => {
      expect(service.creditCost(0, 0)).toBe(0);
      expect(service.creditCost(null, null)).toBe(0);
    });

    it('ignores negative token counts', () => {
      expect(service.creditCost(-5, -5)).toBe(0);
    });
  });

  describe('startOfWeekUtc', () => {
    const { service } = makeService(300);

    it('returns the Monday of the given week', () => {
      // 2026-08-05 is a Wednesday → Monday is 2026-08-03.
      expect(service.startOfWeekUtc(utc(2026, 8, 5))).toBe('2026-08-03');
    });

    it('treats Monday as the start and Sunday as the end of the same week', () => {
      expect(service.startOfWeekUtc(utc(2026, 8, 3))).toBe('2026-08-03');
      expect(
        service.startOfWeekUtc(new Date(Date.UTC(2026, 7, 9, 23, 59, 59))),
      ).toBe('2026-08-03');
      // The next day rolls into a new week.
      expect(service.startOfWeekUtc(utc(2026, 8, 10))).toBe('2026-08-10');
    });

    it('handles a week spanning a year boundary', () => {
      // 2027-01-01 is a Friday → Monday is 2026-12-28.
      expect(service.startOfWeekUtc(utc(2027, 1, 1))).toBe('2026-12-28');
    });
  });

  describe('hold / settle / release', () => {
    it('reserves the action estimate', async () => {
      const { service, rows } = makeService(300);
      const held = await service.hold('u1', CreditAction.PROJECT_COMPOSITION);
      expect(held).toBe(20);
      expect(rows[0].creditsHeld).toBe(20);
      expect(rows[0].creditsUsed).toBe(0);
    });

    it('refuses when the remaining balance cannot cover the estimate', async () => {
      const { service, seedThisWeek } = makeService(300);
      seedThisWeek(280, 0);
      // 300 − 280 = 20 left, a profile composition needs 70.
      await expect(
        service.hold('u1', CreditAction.PROFILE_COMPOSITION),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('counts existing holds against the balance', async () => {
      const { service, seedThisWeek } = makeService(300);
      seedThisWeek(200, 90);
      // 300 − 200 − 90 = 10 left, a project README needs 20.
      await expect(
        service.hold('u1', CreditAction.PROJECT_COMPOSITION),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('never blocks an unlimited plan', async () => {
      const { service, rows } = makeService(-1);
      await expect(
        service.hold('u1', CreditAction.PROFILE_COMPOSITION),
      ).resolves.toBe(70);
      expect(rows[0].creditsHeld).toBe(70);
    });

    it('refuses when the plan grants no credits', async () => {
      const { service } = makeService(0);
      await expect(
        service.hold('u1', CreditAction.PROJECT_COMPOSITION),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('settles by releasing the hold and charging the real cost', async () => {
      const { service, rows } = makeService(300);
      const held = await service.hold('u1', CreditAction.PROJECT_COMPOSITION);
      await service.settle('u1', new Date(), held, 12_000, 2_000);

      expect(rows[0].creditsHeld).toBe(0);
      expect(rows[0].creditsUsed).toBe(20);
    });

    it('releases the hold untouched when a run fails', async () => {
      const { service, rows } = makeService(300);
      const held = await service.hold('u1', CreditAction.PROFILE_COMPOSITION);
      await service.release('u1', new Date(), held);

      expect(rows[0].creditsHeld).toBe(0);
      expect(rows[0].creditsUsed).toBe(0);
    });

    it('reports the balance net of used and held credits', async () => {
      const { service } = makeService(300);
      await service.hold('u1', CreditAction.PROJECT_COMPOSITION);
      const balance = await service.balance('u1');

      expect(balance.weeklyCredits).toBe(300);
      expect(balance.held).toBe(20);
      expect(balance.remaining).toBe(280);
      expect(balance.weekResetsAt.endsWith('T00:00:00.000Z')).toBe(true);
    });
  });
});
