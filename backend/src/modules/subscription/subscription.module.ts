import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { PaymentEvent } from '@/modules/subscription/entities/payment-event.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PlansService } from '@/modules/subscription/services/plans.service';
import { QuotaService } from '@/modules/subscription/services/quota.service';

import { AiModelsController } from '@/modules/subscription/controllers/ai-models.controller';
import { ModelsService } from '@/modules/subscription/services/models.service';
import { ListPlansController } from '@/modules/subscription/controllers/list-plans.controller';
import { CheckoutController } from '@/modules/subscription/controllers/checkout.controller';
import { BillingService } from '@/modules/subscription/services/billing.service';
import { StripeGateway } from '@/modules/subscription/adapters/stripe.gateway';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';

/**
 * Subscription module — plans, the AI-model catalog, per-period usage, and billing
 * (region-selected payment gateways + hosted checkout). Owns the plan/quota domain
 * services ({@link PlansService}, {@link QuotaService}) that the compose modules consume.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      AiModel,
      Plan,
      Subscription,
      UsageCounter,
      PlanPrice,
      PaymentEvent,
    ]),
    IdentityModule,
  ],
  controllers: [AiModelsController, ListPlansController, CheckoutController],
  providers: [
    ModelsService,
    PlansService,
    QuotaService,
    BillingService,
    PaymentGatewayFactory,
    StripeGateway,
    AuthGuard,
  ],
  exports: [PlansService, QuotaService],
})
export class SubscriptionModule {}
