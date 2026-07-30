import { Logger } from '@nestjs/common';
import { Repository, type FindOptionsWhere, type ObjectLiteral } from 'typeorm';

import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';
import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';

export interface AgentOutput {
  markdown: string;
  inputTokens: number;
  outputTokens: number;
}

export type PhaseHook = (phase: string) => Promise<void>;

/** Usage-counter column a runner refunds when its job fails. */
export type UsageField = 'profileCompositionsUsed' | 'generationsUsed';

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
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

/**
 * Shared lifecycle for a composition worker: load the job, stream phases to the
 * `phase` column for polling, run the concrete agent, persist the result, and refund
 * the reserved quota on failure. The persona ("Compose Your Profile") and project
 * ("Compose a README") runners each subclass this over their own entity — separate
 * queues, separate consumers — supplying only how they {@link generate} and which
 * quota to refund.
 */
export abstract class GenerationRunner<
  T extends CompositionEntity & ObjectLiteral,
> {
  protected readonly logger = new Logger(this.constructor.name);

  /** The usage field to refund on failure (per flow). */
  protected abstract readonly usageField: UsageField;

  constructor(
    protected readonly compositions: Repository<T>,
    protected readonly usage: Repository<UsageCounter>,
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
      this.logger.log(
        `Composition ${gen.id} completed — ${result.outputTokens} output tokens.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      gen.status = GenerationStatus.FAILED;
      gen.phase = 'failed';
      gen.error = message;
      await this.compositions.save(gen);
      await this.refund(gen);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  protected async advance(gen: T, phase: string): Promise<void> {
    gen.status = GenerationStatus.RUNNING;
    gen.phase = phase;
    await this.compositions.save(gen);
  }

  /** Give back the reserved quota when a run fails. */
  private async refund(gen: T): Promise<void> {
    const periodStart = this.periodOf(gen.createdAt);
    const row = await this.usage.findOne({
      where: { userId: gen.userId, periodStart },
    });
    if (row && row[this.usageField] > 0) {
      row[this.usageField] -= 1;
      await this.usage.save(row);
    }
  }

  private periodOf(date: Date): string {
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${date.getUTCFullYear()}-${month}-01`;
  }
}
