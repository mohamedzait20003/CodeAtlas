import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { SubscriptionModule } from '@/modules/subscription/subscription.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { QuotaGuard } from '@/shared/Guards/quota.guard';
import { LlmProviderFactory } from '@/shared/Factories/llm-provider.factory';

import { StartCompositionController } from '@/modules/persona/controllers/start-composition.controller';
import { TailorCompositionController } from '@/modules/persona/controllers/tailor-composition.controller';
import { CompositionStatusController } from '@/modules/persona/controllers/composition-status.controller';
import { CompositionCommitController } from '@/modules/persona/controllers/composition-commit.controller';
import { PersonaCompositionService } from '@/modules/persona/services/persona-composition.service';
import { PersonaTailorService } from '@/modules/persona/services/persona-tailor.service';
import { PersonaCommitService } from '@/modules/persona/services/persona-commit.service';
import { PersonaCompositionFactory } from '@/modules/persona/factories/persona-composition.factory';

/**
 * Persona module — "Compose Your Profile" (profile README from résumé + all repos).
 * Enqueues + reports; the agentic job runs in the persona worker.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, PersonaComposition, AiModel]),
    IdentityModule,
    SubscriptionModule,
  ],
  controllers: [
    StartCompositionController,
    TailorCompositionController,
    CompositionStatusController,
    CompositionCommitController,
  ],
  providers: [
    PersonaCompositionService,
    PersonaTailorService,
    PersonaCommitService,
    PersonaCompositionFactory,
    LlmProviderFactory,
    AuthGuard,
    QuotaGuard,
  ],
})
export class PersonaModule {}
