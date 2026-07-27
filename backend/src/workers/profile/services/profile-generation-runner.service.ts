import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';
import {
  GenerationRunner,
  type AgentOutput,
  type PhaseHook,
  type UsageField,
} from '@/workers/shared/generation-runner.base';
import { ProfileContextService } from './profile-context.service';
import { ProfileReadmeAgentService } from './profile-readme-agent.service';

/**
 * "Compose Your Profile" worker: aggregates the user's résumé + all their repos and
 * runs the persona agent to produce a GitHub profile README. Consumes the
 * `profile-generation` queue. Shared job lifecycle lives in {@link GenerationRunner}.
 */
@Injectable()
export class ProfileGenerationRunner extends GenerationRunner<PersonaComposition> {
  protected readonly usageField: UsageField = 'profileCompositionsUsed';

  constructor(
    @InjectRepository(PersonaComposition)
    compositions: Repository<PersonaComposition>,
    @InjectRepository(UsageCounter) usage: Repository<UsageCounter>,
    private readonly context: ProfileContextService,
    private readonly agent: ProfileReadmeAgentService,
  ) {
    super(compositions, usage);
  }

  protected async generate(
    gen: PersonaComposition,
    provider: LlmProvider,
    model: string,
    onPhase: PhaseHook,
  ): Promise<AgentOutput> {
    const context = await this.context.gather(gen.userId);
    return this.agent.run({
      context,
      intent: gen.intent,
      provider,
      modelId: model,
      onPhase,
    });
  }
}
