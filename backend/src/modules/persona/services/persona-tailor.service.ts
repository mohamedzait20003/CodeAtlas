import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HumanMessage,
  SystemMessage,
  type AIMessage,
} from '@langchain/core/messages';

import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { ModelTier } from '@/shared/Domain/enums/model-tier.enum';
import { LlmProviderFactory } from '@/shared/Factories/llm-provider.factory';
import type { TailorView } from '@/modules/persona/dto/composition.dto';

/** Turns a rough note into a sharp instruction for the persona agent. */
const TAILOR_SYSTEM = `You refine a developer's rough note into a clear, effective instruction for an AI that will write their GitHub profile README. Keep it concise (1–3 sentences), preserve their meaning, and make the intended tone and focus explicit. Output only the refined instruction — no preamble, no quotes.`;

/** Synchronous helper: sharpen a user's rough intent with a cheap model. */
@Injectable()
export class PersonaTailorService {
  constructor(
    @InjectRepository(AiModel) private readonly aiModels: Repository<AiModel>,
    private readonly llm: LlmProviderFactory,
  ) {}

  async tailor(draft: string): Promise<TailorView> {
    const model = await this.cheapestModel();
    const chat = this.llm.forModel(model.provider, model.modelId);
    const res = await chat.invoke([
      new SystemMessage(TAILOR_SYSTEM),
      new HumanMessage(draft),
    ]);
    return { Text: textOf(res).trim() };
  }

  /** The cheapest enabled model (economy default) for lightweight tailoring. */
  private async cheapestModel(): Promise<AiModel> {
    const model =
      (await this.aiModels.findOne({
        where: { isEnabled: true, tier: ModelTier.ECONOMY, isDefault: true },
      })) ??
      (await this.aiModels.findOne({
        where: { isEnabled: true, tier: ModelTier.ECONOMY },
      })) ??
      (await this.aiModels.findOne({ where: { isEnabled: true } }));
    if (!model) {
      throw new BadRequestException('No AI model is available right now.');
    }
    return model;
  }
}

/** Plain text out of an AI message (Gemini returns a string; guard the union). */
function textOf(msg: AIMessage): string {
  const content = msg.content;
  if (typeof content === 'string') return content;
  return content
    .map((part) =>
      typeof part === 'string' ? part : 'text' in part ? part.text : '',
    )
    .join('');
}
