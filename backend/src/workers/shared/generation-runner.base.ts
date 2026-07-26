import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Generation } from '@/modules/generations/entities/generation.entity';
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

/**
 * Shared lifecycle for a generation worker: load the job, stream phases to the
 * `phase` column for polling, run the concrete agent, persist the result, and
 * refund the reserved quota on failure. The profile ("Compose Your Profile") and repo
 * ("Compose a README") runners each subclass this — separate queues, separate
 * consumers — and supply only how they {@link generate} and which quota to refund.
 */
export abstract class GenerationRunner {
  protected readonly logger = new Logger(this.constructor.name);

  /** The usage field to refund on failure (per generation kind). */
  protected abstract readonly usageField: UsageField;

  constructor(
    protected readonly generations: Repository<Generation>,
    protected readonly usage: Repository<UsageCounter>,
  ) {}

  /** Gather the working context and run the agent, producing the README. */
  protected abstract generate(
    gen: Generation,
    provider: LlmProvider,
    model: string,
    onPhase: PhaseHook,
  ): Promise<AgentOutput>;

  async run(generationId: string): Promise<void> {
    const gen = await this.generations.findOne({ where: { id: generationId } });
    if (!gen) {
      this.logger.warn(`Generation ${generationId} not found — skipping.`);
      return;
    }

    try {
      await this.advance(gen, 'gathering');

      const { provider, model } = gen;
      if (!provider || !model) {
        throw new Error('Generation has no model assigned.');
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
      await this.generations.save(gen);
      this.logger.log(
        `Generation ${gen.id} (${gen.kind}) completed — ${result.outputTokens} output tokens.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      gen.status = GenerationStatus.FAILED;
      gen.phase = 'failed';
      gen.error = message;
      await this.generations.save(gen);
      await this.refund(gen);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  protected async advance(gen: Generation, phase: string): Promise<void> {
    gen.status = GenerationStatus.RUNNING;
    gen.phase = phase;
    await this.generations.save(gen);
  }

  /** Give back the reserved quota when a run fails. */
  private async refund(gen: Generation): Promise<void> {
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
