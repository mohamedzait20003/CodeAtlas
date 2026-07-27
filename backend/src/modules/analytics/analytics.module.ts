import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import { User } from '@/modules/identity/entities/user.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { Repo } from '@/modules/project/entities/repo.entity';
import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { ProjectComposition } from '@/modules/project/entities/project-composition.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';

import { DashboardController } from '@/modules/analytics/controllers/dashboard.controller';
import { DashboardService } from '@/modules/analytics/services/dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Subscription,
      Plan,
      UsageCounter,
      Repo,
      PersonaComposition,
      ProjectComposition,
    ]),
    CacheModule.register({ ttl: 30_000 }),
    IdentityModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, AuthGuard],
})
export class AnalyticsModule {}
