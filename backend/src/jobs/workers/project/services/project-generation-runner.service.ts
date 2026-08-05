import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectComposition } from '@/modules/project/entities/project-composition.entity';
import { Repo } from '@/modules/project/entities/repo.entity';
import { CreditsService } from '@/modules/subscription/services/credits.service';
import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';
import {
  GenerationRunner,
  type AgentOutput,
  type PhaseHook,
} from '@/jobs/shared/generation-runner.base';
import { ProjectContentService } from './project-content.service';
import { ProjectReadmeAgentService } from './project-readme-agent.service';

/**
 * "Compose a README" worker: reads one target repository's content and runs
 * the project agent to produce its README. Consumes the `repo-generation` queue.
 * Shared job lifecycle lives in {@link GenerationRunner}.
 */
@Injectable()
export class ProjectGenerationRunner extends GenerationRunner<ProjectComposition> {
  constructor(
    @InjectRepository(ProjectComposition)
    compositions: Repository<ProjectComposition>,
    credits: CreditsService,
    @InjectRepository(Repo) private readonly repos: Repository<Repo>,
    private readonly repoContent: ProjectContentService,
    private readonly repoAgent: ProjectReadmeAgentService,
  ) {
    super(compositions, credits);
  }

  protected async generate(
    gen: ProjectComposition,
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
