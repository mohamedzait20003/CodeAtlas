import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

import { User } from '@/modules/identity/entities/user.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Repo } from '@/modules/project/entities/repo.entity';
import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { ProjectComposition } from '@/modules/project/entities/project-composition.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { SubscriptionModule } from '@/modules/subscription/subscription.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';

import { DashboardController } from '@/modules/analytics/controllers/dashboard.controller';
import { DashboardService } from '@/modules/analytics/services/dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Subscription,
      Plan,
      Repo,
      PersonaComposition,
      ProjectComposition,
    ]),
    CacheModule.register({ ttl: 30_000 }),
    IdentityModule,
    SubscriptionModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, AuthGuard],
})
export class AnalyticsModule {}
