import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { User } from '@/modules/identity/entities/user.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Repo } from '@/modules/project/entities/repo.entity';
import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { ProjectComposition } from '@/modules/project/entities/project-composition.entity';
import { PlanTier } from '@/shared/Domain/enums/plan-tier.enum';
import { CreditsService } from '@/modules/subscription/services/credits.service';
import type { DashboardData } from '@/modules/analytics/dto/dashboard.dto';

/** How long a per-user dashboard payload is cached (ms). */
const DASHBOARD_TTL_MS = 30_000;
const RECENT_LIMIT = 5;

const PLAN_NAMES: Record<PlanTier, string> = {
  [PlanTier.FREE]: 'Free',
  [PlanTier.STARTER]: 'Starter',
  [PlanTier.PRO]: 'Pro',
};

/**
 * Assembles the client dashboard summary (plan, usage, GitHub status, recent
 * generations) for a user. Results are cached per-user for a short window to
 * absorb the dashboard's frequent polling without re-querying every time.
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    private readonly credits: CreditsService,
    @InjectRepository(Repo) private readonly repos: Repository<Repo>,
    @InjectRepository(PersonaComposition)
    private readonly personas: Repository<PersonaComposition>,
    @InjectRepository(ProjectComposition)
    private readonly projects: Repository<ProjectComposition>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getDashboard(userId: string): Promise<DashboardData> {
    const key = `dashboard:${userId}`;

    const cached = await this.cache.get<DashboardData>(key);
    if (cached) return cached;

    const data = await this.build(userId);
    await this.cache.set(key, data, DASHBOARD_TTL_MS);
    return data;
  }

  /** Invalidate a user's cached dashboard (call after repos/generations change). */
  async invalidate(userId: string): Promise<void> {
    await this.cache.del(`dashboard:${userId}`);
  }

  private async build(userId: string): Promise<DashboardData> {
    const [user, subscription, reposAnalyzed, credits, personas, projects] =
      await Promise.all([
        this.users.findOne({ where: { id: userId } }),
        this.subscriptions.findOne({ where: { userId } }),
        this.repos.count({ where: { userId } }),
        this.credits.balance(userId),
        this.personas.find({
          where: { userId },
          order: { createdAt: 'DESC' },
          take: RECENT_LIMIT,
        }),
        this.projects.find({
          where: { userId },
          order: { createdAt: 'DESC' },
          take: RECENT_LIMIT,
          relations: ['repo'],
        }),
      ]);

    // Merge the two composition streams into one recent list (newest first).
    const recent = [
      ...personas.map((g) => ({
        Id: g.id,
        Repo: 'Profile',
        Status: g.status,
        Model: g.model,
        PushMode: g.pushMode,
        PrUrl: g.prUrl,
        CreatedAt: g.createdAt,
      })),
      ...projects.map((g) => ({
        Id: g.id,
        Repo: (g.repo as Repo | undefined)?.fullName ?? '—',
        Status: g.status,
        Model: g.model,
        PushMode: g.pushMode,
        PrUrl: g.prUrl,
        CreatedAt: g.createdAt,
      })),
    ]
      .sort((a, b) => b.CreatedAt.getTime() - a.CreatedAt.getTime())
      .slice(0, RECENT_LIMIT);

    // Fall back to the Free plan when the user has no subscription yet.
    const plan =
      (subscription?.plan as Plan | undefined) ??
      (await this.plans.findOne({ where: { tier: PlanTier.FREE } }));

    const tier = plan?.tier ?? PlanTier.FREE;

    return {
      GithubLinked: Boolean(user?.githubId),
      Plan: {
        Tier: tier,
        Name: PLAN_NAMES[tier],
        Status: subscription?.status ?? 'active',
        EndsAt: subscription?.cancelAtPeriodEnd
          ? (subscription.effectiveEndAt?.toISOString() ?? null)
          : null,
      },
      Usage: {
        WeeklyCredits: credits.weeklyCredits,
        CreditsUsed: credits.used,
        CreditsHeld: credits.held,
        CreditsRemaining: credits.remaining,
        CreditsResetAt: credits.weekResetsAt,
        ReposAnalyzed: reposAnalyzed,
        PeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
      },
      RecentGenerations: recent.map((g) => ({
        Id: g.Id,
        Repo: g.Repo,
        Status: g.Status,
        Model: g.Model,
        PushMode: g.PushMode,
        PrUrl: g.PrUrl,
        CreatedAt: g.CreatedAt.toISOString(),
      })),
    };
  }
}
