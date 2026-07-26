import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Generation } from '@/modules/generations/entities/generation.entity';
import { Repo } from '@/modules/generations/entities/repo.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { PlanService } from '@/modules/subscription/services/plan.service';
import { GenerationKind } from '@/shared/Domain/enums/generation-kind.enum';
import { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';
import { PushMode } from '@/shared/Domain/enums/push-mode.enum';
import { tierWithin } from '@/shared/Domain/enums/model-tier.enum';
import { GithubReposService } from '@/modules/generations/services/github-repos.service';
import { GithubCommitService } from '@/modules/generations/services/github-commit.service';
import { RepoGenerationFactory } from '@/modules/generations/factories/repo-generation.factory';
import type { RepoItem } from '@/modules/generations/dto/repo.dto';
import type { StartRepoCompositionDto } from '@/modules/generations/dto/start-repo-composition.dto';
import { composeRepoBrief } from '@/modules/generations/dto/brief.dto';
import type {
  CommitView,
  CompositionStartView,
  CompositionView,
} from '@/modules/generations/dto/composition.dto';

/**
 * "Compose a README" lifecycle: resolves the target repo (find-or-create local
 * row) + the user's plan/model, records a REPO_README generation and enqueues it
 * via {@link RepoGenerationFactory} (its own worker), reports status for polling,
 * and commits the (edited) README to the repo. The repo-generation quota is
 * reserved upstream by the {@link Quota} decorator on the controller.
 */
@Injectable()
export class RepoGenerationService {
  constructor(
    @InjectRepository(Generation)
    private readonly generations: Repository<Generation>,
    @InjectRepository(Repo) private readonly repoRows: Repository<Repo>,
    @InjectRepository(AiModel) private readonly aiModels: Repository<AiModel>,
    private readonly plans: PlanService,
    private readonly repos: GithubReposService,
    private readonly queue: RepoGenerationFactory,
    private readonly github: GithubCommitService,
  ) {}

  async start(
    userId: string,
    githubRepoId: string,
    dto: StartRepoCompositionDto,
  ): Promise<CompositionStartView> {
    const item = await this.repos.findById(userId, githubRepoId);
    if (!item) throw new NotFoundException('Repository not found.');

    const plan = await this.plans.forUser(userId);
    const model = await this.resolveModel(plan, dto.modelId);
    const repo = await this.ensureRepo(userId, item);

    const generation = await this.generations.save(
      this.generations.create({
        userId,
        kind: GenerationKind.REPO_README,
        repoId: repo.id,
        status: GenerationStatus.QUEUED,
        phase: 'queued',
        intent: composeRepoBrief(dto.brief),
        aiModelId: model.id,
        provider: model.provider,
        model: model.modelId,
        pushMode: PushMode.DIRECT, // all tiers direct-push (mirrors profile)
      }),
    );

    await this.queue.queue(generation.id);
    return { Id: generation.id };
  }

  async status(userId: string, id: string): Promise<CompositionView> {
    const gen = await this.generations.findOne({
      where: { id, userId, kind: GenerationKind.REPO_README },
    });
    if (!gen) throw new NotFoundException('Generation not found.');

    return {
      Id: gen.id,
      Status: gen.status,
      Phase: gen.phase,
      GeneratedMd: gen.generatedMd,
      Model: gen.model,
      Error: gen.error,
      CreatedAt: gen.createdAt.toISOString(),
    };
  }

  /** Push the (edited) README straight to the target repo's default branch. */
  async commit(
    userId: string,
    id: string,
    content: string,
  ): Promise<CommitView> {
    const gen = await this.generations.findOne({
      where: { id, userId, kind: GenerationKind.REPO_README },
    });
    if (!gen) throw new NotFoundException('Generation not found.');
    if (gen.status !== GenerationStatus.COMPLETED) {
      throw new BadRequestException('This generation is not ready to commit.');
    }
    if (!gen.repoId) {
      throw new BadRequestException('Generation has no target repository.');
    }
    const repo = await this.repoRows.findOne({ where: { id: gen.repoId } });
    if (!repo) throw new NotFoundException('Target repository not found.');

    const result = await this.github.commitRepoReadme(
      userId,
      repo.fullName,
      repo.defaultBranch,
      content,
    );

    gen.generatedMd = content;
    gen.commitSha = result.commitSha;
    gen.pushMode = PushMode.DIRECT;
    await this.generations.save(gen);

    return { CommitSha: result.commitSha, HtmlUrl: result.htmlUrl };
  }

  /** Find-or-create the local Repo row for a GitHub repo (refreshing metadata). */
  private async ensureRepo(userId: string, item: RepoItem): Promise<Repo> {
    const existing = await this.repoRows.findOne({
      where: { userId, githubRepoId: item.Id },
    });
    const repo =
      existing ?? this.repoRows.create({ userId, githubRepoId: item.Id });
    repo.fullName = item.FullName;
    repo.defaultBranch = item.DefaultBranch;
    repo.isPrivate = item.Private;
    return this.repoRows.save(repo);
  }

  /** Selected model (tier-checked) or the plan's default from the catalog. */
  private async resolveModel(plan: Plan, modelId?: string): Promise<AiModel> {
    const allowed = (
      await this.aiModels.find({ where: { isEnabled: true } })
    ).filter((m) => tierWithin(plan.modelTier, m.tier));

    if (allowed.length === 0) {
      throw new BadRequestException(
        'No AI model is available right now. Please try again later.',
      );
    }
    if (modelId) {
      const chosen = allowed.find((m) => m.id === modelId);
      if (!chosen) {
        throw new ForbiddenException(
          'That model is not available on your plan.',
        );
      }
      return chosen;
    }
    return allowed.find((m) => m.isDefault) ?? allowed[0];
  }
}
