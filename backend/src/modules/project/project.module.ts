import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import { User } from '@/modules/identity/entities/user.entity';
import { ProjectComposition } from '@/modules/project/entities/project-composition.entity';
import { Repo } from '@/modules/project/entities/repo.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { SubscriptionModule } from '@/modules/subscription/subscription.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { QuotaGuard } from '@/shared/Guards/quota.guard';

import { ListReposController } from '@/modules/project/controllers/list-repos.controller';
import { RepoDetailController } from '@/modules/project/controllers/repo-detail.controller';
import { GenerateCompositionController } from '@/modules/project/controllers/generate-composition.controller';
import { ProjectStatusController } from '@/modules/project/controllers/project-status.controller';
import { ProjectCommitController } from '@/modules/project/controllers/project-commit.controller';
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
    TypeOrmModule.forFeature([User, ProjectComposition, Repo, AiModel]),
    CacheModule.register({ ttl: 120_000 }),
    IdentityModule,
    SubscriptionModule,
  ],
  controllers: [
    ListReposController,
    RepoDetailController,
    GenerateCompositionController,
    ProjectStatusController,
    ProjectCommitController,
  ],
  providers: [
    GithubReposService,
    ProjectCompositionService,
    ProjectCommitService,
    ProjectCompositionFactory,
    AuthGuard,
    QuotaGuard,
  ],
})
export class ProjectModule {}
