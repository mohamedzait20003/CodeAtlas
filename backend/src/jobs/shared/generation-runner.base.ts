import { Logger } from '@nestjs/common';
import { Repository, type FindOptionsWhere, type ObjectLiteral } from 'typeorm';

import { CreditsService } from '@/modules/subscription/services/credits.service';
import { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';
import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';

export interface AgentOutput {
  markdown: string;
  inputTokens: number;
  outputTokens: number;
}

export type PhaseHook = (phase: string) => Promise<void>;

/** The common composition-row shape the shared runner lifecycle reads + writes. */
export interface CompositionEntity {
  id: string;
  userId: string;
  status: GenerationStatus;
  phase: string | null;
  provider: LlmProvider | null;
  model: string | null;
  generatedMd: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  /** Credits reserved at enqueue; released when the run settles or fails. */
  creditsHeld: number;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

/**
 * Shared lifecycle for a composition worker: load the job, stream phases to the
 * `phase` column for polling, run the concrete agent, persist the result, and settle
 * the credits it held — charging the run's real token cost on success, releasing the
 * hold untouched on failure. The persona ("Compose Your Profile") and project
 * ("Compose a README") runners each subclass this over their own entity — separate
 * queues, separate consumers — supplying only how they {@link generate}.
 */
export abstract class GenerationRunner<
  T extends CompositionEntity & ObjectLiteral,
> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly compositions: Repository<T>,
    protected readonly credits: CreditsService,
  ) {}

  /** Gather the working context and run the agent, producing the README. */
  protected abstract generate(
    gen: T,
    provider: LlmProvider,
    model: string,
    onPhase: PhaseHook,
  ): Promise<AgentOutput>;

  async run(generationId: string): Promise<void> {
    const gen = await this.compositions.findOne({
      where: { id: generationId } as FindOptionsWhere<T>,
    });
    if (!gen) {
      this.logger.warn(`Composition ${generationId} not found — skipping.`);
      return;
    }

    try {
      await this.advance(gen, 'gathering');

      const { provider, model } = gen;
      if (!provider || !model) {
        throw new Error('Composition has no model assigned.');
      }

      const result = await this.generate(gen, provider, model, (phase) =>
        this.advance(gen, phase),
      );
      if (!result.markdown) {
        throw new Error('The model returned an empty README.');
      }

      gen.generatedMd = result.markdown;
      gen.inputTokens = result.inputTokens;
      gen.outputTokens = result.outputTokens;
      gen.status = GenerationStatus.COMPLETED;
      gen.phase = 'completed';
      gen.completedAt = new Date();
      await this.compositions.save(gen);
      await this.credits.settle(
        gen.userId,
        gen.createdAt,
        gen.creditsHeld,
        result.inputTokens,
        result.outputTokens,
      );
      this.logger.log(
        `Composition ${gen.id} completed — ${result.outputTokens} output tokens.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      gen.status = GenerationStatus.FAILED;
      gen.phase = 'failed';
      gen.error = message;
      await this.compositions.save(gen);
      await this.credits.release(gen.userId, gen.createdAt, gen.creditsHeld);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  protected async advance(gen: T, phase: string): Promise<void> {
    gen.status = GenerationStatus.RUNNING;
    gen.phase = phase;
    await this.compositions.save(gen);
  }
}
