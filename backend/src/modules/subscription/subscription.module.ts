import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PlanService } from '@/modules/subscription/services/plan.service';
import { QuotaService } from '@/modules/subscription/services/quota.service';

import { AiModelsController } from '@/modules/subscription/controllers/ai-models.controller';
import { AiModelsService } from '@/modules/subscription/services/ai-models.service';

/**
 * Subscription module — plans, the AI-model catalog, per-period usage, and (later)
 * billing. Hosts the `/ai-models` endpoint, and owns the plan/quota domain services
 * ({@link PlanService}, {@link QuotaService}) that the compose modules consume.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, AiModel, Plan, Subscription, UsageCounter]),
    IdentityModule,
  ],
  controllers: [AiModelsController],
  providers: [AiModelsService, PlanService, QuotaService, AuthGuard],
  exports: [PlanService, QuotaService],
})
export class SubscriptionModule {}
