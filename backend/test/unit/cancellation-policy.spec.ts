import { CancellationPolicyFactory } from '@/modules/subscription/factories/cancellation-policy.factory';

const utc = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d));

describe('CancellationPolicyFactory', () => {
  const factory = new CancellationPolicyFactory();

  describe('monthly', () => {
    it('keeps access to the last instant of the current month', () => {
      const outcome = factory.resolve('month', {
        now: utc(2026, 3, 15),
        periodEnd: utc(2026, 4, 1),
        yearlyAmount: 9000,
      });
      expect(outcome.effectiveEnd.toISOString()).toBe(
        '2026-03-31T23:59:59.999Z',
      );
      expect(outcome.refundAmount).toBe(0);
    });

    it('falls back to the monthly rule for an unknown interval', () => {
      for (const interval of [null, undefined, 'weekly']) {
        expect(
          factory.resolve(interval, {
            now: utc(2026, 3, 15),
            periodEnd: utc(2027, 1, 1),
            yearlyAmount: 9000,
          }).refundAmount,
        ).toBe(0);
      }
    });
  });

  describe('yearly', () => {
    it('refunds the whole months left at 1/12 of the yearly price', () => {
      // Access ends 31 Mar; the paid year runs to 1 Jan → Apr…Dec = 9 months.
      const outcome = factory.resolve('year', {
        now: utc(2026, 3, 15),
        periodEnd: utc(2027, 1, 1),
        yearlyAmount: 9000, // $90.00 → $7.50/month
      });
      expect(outcome.effectiveEnd.toISOString()).toBe(
        '2026-03-31T23:59:59.999Z',
      );
      expect(outcome.refundAmount).toBe(6750); // 9 × 750
    });

    it('floors uneven splits so it never refunds more than was paid', () => {
      const outcome = factory.resolve('year', {
        now: utc(2026, 3, 15),
        periodEnd: utc(2027, 1, 1),
        yearlyAmount: 1234,
      });
      // floor(1234 × 9 / 12) = floor(925.5) = 925
      expect(outcome.refundAmount).toBe(925);
    });

    it('refunds nothing when no whole month remains', () => {
      expect(
        factory.resolve('year', {
          now: utc(2026, 3, 15),
          periodEnd: utc(2026, 4, 1),
          yearlyAmount: 9000,
        }).refundAmount,
      ).toBe(0);
    });

    it('refunds nothing when the term has already ended', () => {
      expect(
        factory.resolve('year', {
          now: utc(2026, 3, 15),
          periodEnd: utc(2026, 1, 1),
          yearlyAmount: 9000,
        }).refundAmount,
      ).toBe(0);
    });

    it('caps the refund at a full year for an absurd period end', () => {
      expect(
        factory.resolve('year', {
          now: utc(2026, 3, 15),
          periodEnd: utc(2030, 1, 1),
          yearlyAmount: 9000,
        }).refundAmount,
      ).toBe(9000); // 12/12 — never more than one term
    });

    it('refunds nothing when the period end or yearly price is unknown', () => {
      expect(
        factory.resolve('year', {
          now: utc(2026, 3, 15),
          periodEnd: null,
          yearlyAmount: 9000,
        }).refundAmount,
      ).toBe(0);
      expect(
        factory.resolve('year', {
          now: utc(2026, 3, 15),
          periodEnd: utc(2027, 1, 1),
          yearlyAmount: null,
        }).refundAmount,
      ).toBe(0);
    });
  });
});
