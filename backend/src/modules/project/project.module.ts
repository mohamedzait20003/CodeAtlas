import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import { User } from '@/modules/identity/entities/user.entity';
import { ProjectComposition } from '@/modules/project/entities/project-composition.entity';
import { Repo } from '@/modules/project/entities/repo.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { QuotaGuard } from '@/shared/Guards/quota.guard';
import { PlanService } from '@/modules/subscription/services/plan.service';
import { QuotaService } from '@/modules/subscription/services/quota.service';

import { ReposController } from '@/modules/project/controllers/repos.controller';
import { GithubReposService } from '@/modules/project/services/github-repos.service';
import { ProjectCompositionService } from '@/modules/project/services/project-composition.service';
import { ProjectCommitService } from '@/modules/project/services/project-commit.service';
import { ProjectCompositionFactory } from '@/modules/project/factories/project-composition.factory';

/**
 * Project module — "Compose a README" (one repository's README) + repo listing.
 * Enqueues + reports; the agentic job runs in the project worker.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ProjectComposition,
      Repo,
      AiModel,
      Subscription,
      Plan,
      UsageCounter,
    ]),
    CacheModule.register({ ttl: 120_000 }),
    IdentityModule,
  ],
  controllers: [ReposController],
  providers: [
    GithubReposService,
    ProjectCompositionService,
    ProjectCommitService,
    ProjectCompositionFactory,
    PlanService,
    QuotaService,
    AuthGuard,
    QuotaGuard,
  ],
})
export class ProjectModule {}
