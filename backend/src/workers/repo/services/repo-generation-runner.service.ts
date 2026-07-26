import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Generation } from '@/modules/generations/entities/generation.entity';
import { Repo } from '@/modules/generations/entities/repo.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';
import {
  GenerationRunner,
  type AgentOutput,
  type PhaseHook,
  type UsageField,
} from '@/workers/shared/generation-runner.base';
import { RepoContentService } from './repo-content.service';
import { RepoReadmeAgentService } from './repo-readme-agent.service';

/**
 * "Compose a README" worker: reads one target repository's content and runs
 * the repo agent to produce its README. Consumes the `repo-generation` queue.
 * Shared job lifecycle lives in {@link GenerationRunner}.
 */
@Injectable()
export class RepoGenerationRunner extends GenerationRunner {
  protected readonly usageField: UsageField = 'generationsUsed';

  constructor(
    @InjectRepository(Generation) generations: Repository<Generation>,
    @InjectRepository(UsageCounter) usage: Repository<UsageCounter>,
    @InjectRepository(Repo) private readonly repos: Repository<Repo>,
    private readonly repoContent: RepoContentService,
    private readonly repoAgent: RepoReadmeAgentService,
  ) {
    super(generations, usage);
  }

  protected async generate(
    gen: Generation,
    provider: LlmProvider,
    model: string,
    onPhase: PhaseHook,
  ): Promise<AgentOutput> {
    if (!gen.repoId) {
      throw new Error('Repo generation has no target repository.');
    }
    const repo = await this.repos.findOne({ where: { id: gen.repoId } });
    if (!repo) throw new Error('Target repository not found.');

    const content = await this.repoContent.read(
      gen.userId,
      repo.fullName,
      repo.defaultBranch,
    );
    return this.repoAgent.run({
      context: content,
      intent: gen.intent,
      provider,
      modelId: model,
      onPhase,
    });
  }
}
