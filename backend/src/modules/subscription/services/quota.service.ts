import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { PlanService } from '@/modules/subscription/services/plan.service';
import { QuotaKind } from '@/shared/Domain/enums/quota-kind.enum';

type UsageField = 'profileCompositionsUsed' | 'generationsUsed';

const METRICS: Record<
  QuotaKind,
  {
    label: string;
    field: UsageField;
    limit: (plan: Plan) => number | undefined;
  }
> = {
  [QuotaKind.PROFILE_COMPOSITION]: {
    label: 'Compose Your Profile',
    field: 'profileCompositionsUsed',
    limit: (plan) => plan.features.profileCompositions,
  },
  [QuotaKind.REPO_GENERATION]: {
    label: 'README generation',
    field: 'generationsUsed',
    limit: (plan) => plan.generationLimit,
  },
};

@Injectable()
export class QuotaService {
  constructor(
    @InjectRepository(UsageCounter)
    private readonly usage: Repository<UsageCounter>,
    private readonly plans: PlanService,
  ) {}

  async reserve(userId: string, kind: QuotaKind): Promise<void> {
    const metric = METRICS[kind];
    const plan = await this.plans.forUser(userId);
    const limit = metric.limit(plan);

    // Fail closed: a missing/misconfigured limit denies rather than silently
    // allowing unlimited usage (a mis-seeded plan must never grant infinite runs).
    if (limit === undefined) {
      throw new ForbiddenException(
        `Your plan does not include ${metric.label}.`,
      );
    }
    // -1 = unlimited; 0 or negative = not included.
    if (limit !== -1 && limit <= 0) {
      throw new ForbiddenException(
        `Your plan does not include ${metric.label}.`,
      );
    }

    const periodStart = this.currentPeriodStart();
    const row =
      (await this.usage.findOne({ where: { userId, periodStart } })) ??
      this.usage.create({
        userId,
        periodStart,
        generationsUsed: 0,
        profileCompositionsUsed: 0,
      });

    if (limit !== -1 && row[metric.field] >= limit) {
      throw new ForbiddenException(
        `You've used all ${limit} ${metric.label} run${
          limit === 1 ? '' : 's'
        } for this period.`,
      );
    }

    row[metric.field] += 1;
    await this.usage.save(row);
  }

  /** First day of the current UTC month, as the usage period key (YYYY-MM-01). */
  private currentPeriodStart(): string {
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${now.getUTCFullYear()}-${month}-01`;
  }
}
