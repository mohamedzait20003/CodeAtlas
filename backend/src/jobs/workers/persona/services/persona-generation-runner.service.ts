import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { CreditsService } from '@/modules/subscription/services/credits.service';
import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';
import {
  GenerationRunner,
  type AgentOutput,
  type PhaseHook,
} from '@/jobs/shared/generation-runner.base';
import { PersonaContextService } from './persona-context.service';
import { PersonaReadmeAgentService } from './persona-readme-agent.service';

/**
 * "Compose Your Profile" worker: aggregates the user's résumé + all their repos and
 * runs the persona agent to produce a GitHub profile README. Consumes the
 * `profile-generation` queue. Shared job lifecycle lives in {@link GenerationRunner}.
 */
@Injectable()
export class PersonaGenerationRunner extends GenerationRunner<PersonaComposition> {
  constructor(
    @InjectRepository(PersonaComposition)
    compositions: Repository<PersonaComposition>,
    credits: CreditsService,
    private readonly context: PersonaContextService,
    private readonly agent: PersonaReadmeAgentService,
  ) {
    super(compositions, credits);
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
