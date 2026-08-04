import { Injectable } from '@nestjs/common';

import type {
  CancellationOutcome,
  CancellationRequest,
} from '@/modules/subscription/dto/billing.dto';

/**
 * Produces the cancellation outcome for a subscription's billing interval.
 *
 * The rules are pure arithmetic over a closed set of intervals, so they live
 * here as branches rather than as injected strategy objects:
 *   • monthly → access to the end of the current month, no refund
 *   • yearly  → same end date, plus every whole month still left in the paid
 *               term refunded at 1/12 of the yearly price
 * Monthly is the fallback for an unknown interval — the stricter rule, so an
 * unexpected value can never over-refund.
 */
@Injectable()
export class CancellationPolicyFactory {
  resolve(
    interval: string | null | undefined,
    request: CancellationRequest,
  ): CancellationOutcome {
    const effectiveEnd = this.endOfMonth(request.now);

    if (interval !== 'year') {
      return {
        effectiveEnd,
        refundAmount: 0,
        reason:
          'Your monthly plan stays active until the end of this month. No refund is issued for the current month.',
      };
    }

    const months = this.remainingWholeMonths(effectiveEnd, request.periodEnd);
    // Multiply before dividing so minor units stay integral; floored so we
    // never refund more than was paid.
    const refundAmount = Math.max(
      0,
      Math.floor(((request.yearlyAmount ?? 0) * months) / 12),
    );

    return {
      effectiveEnd,
      refundAmount,
      reason: refundAmount
        ? `Your yearly plan stays active until the end of this month. The ${months} unused month${months === 1 ? '' : 's'} left in your term will be refunded.`
        : 'Your yearly plan stays active until the end of this month. No whole months remain in your term, so there is nothing to refund.',
    };
  }

  /** Last instant of `date`'s month (UTC) — every plan ends access there. */
  private endOfMonth(date: Date): Date {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );
  }

  /**
   * Whole months still paid for after access ends — i.e. from the first day of
   * the month *after* `effectiveEnd` up to `periodEnd`. Clamped to 0–12.
   */
  private remainingWholeMonths(
    effectiveEnd: Date,
    periodEnd: Date | null,
  ): number {
    if (!periodEnd) return 0;
    const start = new Date(
      Date.UTC(
        effectiveEnd.getUTCFullYear(),
        effectiveEnd.getUTCMonth() + 1,
        1,
      ),
    );
    const months =
      (periodEnd.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (periodEnd.getUTCMonth() - start.getUTCMonth());
    return Math.min(Math.max(months, 0), 12);
  }
}
