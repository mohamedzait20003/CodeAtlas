import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserProfile } from '@/modules/identity/entities/profile.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { Subscription } from '@/modules/subscription/entities/subscription.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { PaymentEvent } from '@/modules/subscription/entities/payment-event.entity';
import { StripeGateway } from '@/modules/subscription/adapters/stripe.gateway';
import { PaymentGatewayFactory } from '@/modules/subscription/factories/payment-gateway.factory';
import { SubscriptionProjectionService } from './services/subscription-projection.service';
import { BillingEventRunner } from './services/billing-event-runner.service';
import { BillingReconciliationService } from './services/billing-reconciliation.service';

/**
 * Billing worker providers — applies verified gateway webhooks to the
 * subscription projection. DB + config come from the parent {@link JobsModule}.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEvent,
      Subscription,
      Plan,
      PlanPrice,
      UserProfile,
    ]),
  ],
  providers: [
    BillingEventRunner,
    BillingReconciliationService,
    SubscriptionProjectionService,
    PaymentGatewayFactory,
    StripeGateway,
  ],
  exports: [BillingEventRunner, BillingReconciliationService],
})
export class BillingWorkerModule {}
