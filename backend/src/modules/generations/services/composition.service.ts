import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Generation } from '@/modules/generations/entities/generation.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { PlanService } from '@/modules/subscription/services/plan.service';
import { GenerationKind } from '@/shared/Domain/enums/generation-kind.enum';
import { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';
import { PushMode } from '@/shared/Domain/enums/push-mode.enum';
import { tierWithin } from '@/shared/Domain/enums/model-tier.enum';
import { GithubCommitService } from '@/modules/generations/services/github-commit.service';
import { ProfileGenerationFactory } from '@/modules/generations/factories/profile-generation.factory';
import type { StartCompositionDto } from '@/modules/generations/dto/start-composition.dto';
import { composeProfileBrief } from '@/modules/generations/dto/brief.dto';
import type {
  CommitView,
  CompositionStartView,
  CompositionView,
} from '@/modules/generations/dto/composition.dto';

/**
 * "Compose Your Profile" job lifecycle. Resolves the user's plan + model (catalog,
 * tier-gated), records the run and enqueues it via {@link ProfileGenerationFactory}, and
 * reports status for polling. The profile-composition quota is reserved upstream
 * by the {@link Quota} decorator on the controller.
 */
@Injectable()
export class CompositionService {
  constructor(
    @InjectRepository(Generation)
    private readonly generations: Repository<Generation>,
    @InjectRepository(AiModel) private readonly aiModels: Repository<AiModel>,
    private readonly plans: PlanService,
    private readonly queue: ProfileGenerationFactory,
    private readonly github: GithubCommitService,
  ) {}

  async start(
    userId: string,
    dto: StartCompositionDto,
  ): Promise<CompositionStartView> {
    const plan = await this.plans.forUser(userId);
    const model = await this.resolveModel(plan, dto.modelId);

    const generation = await this.generations.save(
      this.generations.create({
        userId,
        kind: GenerationKind.PROFILE,
        status: GenerationStatus.QUEUED,
        phase: 'queued',
        intent: composeProfileBrief(dto.brief),
        aiModelId: model.id,
        provider: model.provider,
        model: model.modelId,
        pushMode: PushMode.DIRECT, // all tiers push direct to the default branch
      }),
    );

    await this.queue.queue(generation.id);
    return { Id: generation.id };
  }

  async status(userId: string, id: string): Promise<CompositionView> {
    const gen = await this.generations.findOne({
      where: { id, userId, kind: GenerationKind.PROFILE },
    });
    if (!gen) throw new NotFoundException('Composition not found.');

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

  /** Push the (edited) README straight to the user's profile repo default branch. */
  async commit(
    userId: string,
    id: string,
    content: string,
  ): Promise<CommitView> {
    const gen = await this.generations.findOne({
      where: { id, userId, kind: GenerationKind.PROFILE },
    });
    if (!gen) throw new NotFoundException('Composition not found.');
    if (gen.status !== GenerationStatus.COMPLETED) {
      throw new BadRequestException('This composition is not ready to commit.');
    }

    const result = await this.github.commitProfileReadme(userId, content);

    gen.generatedMd = content; // persist the committed version
    gen.commitSha = result.commitSha;
    gen.pushMode = PushMode.DIRECT;
    await this.generations.save(gen);

    return { CommitSha: result.commitSha, HtmlUrl: result.htmlUrl };
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
