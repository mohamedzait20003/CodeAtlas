import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type {
  CommitView,
  CompositionStartView,
  CompositionView,
} from '@/modules/persona/dto/composition.dto';
import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { PlansService } from '@/modules/subscription/services/plans.service';
import { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';
import { PushMode } from '@/shared/Domain/enums/push-mode.enum';
import { tierWithin } from '@/shared/Domain/enums/model-tier.enum';
import { PersonaCompositionFactory } from '@/modules/persona/factories/persona-composition.factory';
import { PersonaCommitService } from '@/modules/persona/services/persona-commit.service';
import type { StartCompositionDto } from '@/modules/persona/dto/start-composition.dto';
import { composeProfileBrief } from '@/modules/persona/dto/brief.dto';

/**
 * "Compose Your Profile" lifecycle. Resolves the user's plan + model (catalog,
 * tier-gated), records the run and enqueues it via {@link PersonaCompositionFactory},
 * reports status for polling, and commits the (edited) README to the profile repo.
 * The profile-composition quota is reserved upstream by the {@link Quota} decorator.
 */
@Injectable()
export class PersonaCompositionService {
  constructor(
    @InjectRepository(PersonaComposition)
    private readonly compositions: Repository<PersonaComposition>,
    @InjectRepository(AiModel) private readonly aiModels: Repository<AiModel>,
    private readonly plans: PlansService,
    private readonly queue: PersonaCompositionFactory,
    private readonly github: PersonaCommitService,
  ) {}

  async start(
    userId: string,
    dto: StartCompositionDto,
    creditsHeld = 0,
  ): Promise<CompositionStartView> {
    const plan = await this.plans.forUser(userId);
    const model = await this.resolveModel(plan, dto.modelId);

    const composition = await this.compositions.save(
      this.compositions.create({
        userId,
        status: GenerationStatus.QUEUED,
        phase: 'queued',
        intent: composeProfileBrief(dto.brief),
        aiModelId: model.id,
        provider: model.provider,
        model: model.modelId,
        creditsHeld,
        pushMode: PushMode.DIRECT, // all tiers push direct to the default branch
      }),
    );

    await this.queue.queue(composition.id);
    return { Id: composition.id };
  }

  async status(userId: string, id: string): Promise<CompositionView> {
    const gen = await this.compositions.findOne({ where: { id, userId } });
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
    const gen = await this.compositions.findOne({ where: { id, userId } });
    if (!gen) throw new NotFoundException('Composition not found.');
    if (gen.status !== GenerationStatus.COMPLETED) {
      throw new BadRequestException('This composition is not ready to commit.');
    }

    const result = await this.github.commitProfileReadme(userId, content);

    gen.generatedMd = content; // persist the committed version
    gen.commitSha = result.commitSha;
    gen.pushMode = PushMode.DIRECT;
    await this.compositions.save(gen);

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
