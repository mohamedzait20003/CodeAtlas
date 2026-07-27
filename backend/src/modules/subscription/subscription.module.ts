import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PlanService } from '@/modules/subscription/services/plan.service';

import { AiModelsController } from '@/modules/subscription/controllers/ai-models.controller';
import { AiModelsService } from '@/modules/subscription/services/ai-models.service';

/**
 * Subscription module — plans, the AI-model catalog, and (later) billing. Hosts the
 * `/ai-models` endpoint (the picker both compose flows use), gated to each caller's
 * plan tier.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, AiModel, Plan, Subscription]),
    IdentityModule,
  ],
  controllers: [AiModelsController],
  providers: [AiModelsService, PlanService, AuthGuard],
})
export class SubscriptionModule {}
