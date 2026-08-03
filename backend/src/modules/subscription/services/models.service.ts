import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiModel } from '@/modules/subscription/entities/ai-model.entity';
import { PlansService } from '@/modules/subscription/services/plans.service';
import { tierWithin } from '@/shared/Domain/enums/model-tier.enum';
import type { AiModelView } from '@/modules/subscription/dto/ai-model.dto';

/** The enabled models a user may pick — those at or below their plan's tier. */
@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(AiModel) private readonly aiModels: Repository<AiModel>,
    private readonly plans: PlansService,
  ) {}

  async available(userId: string): Promise<AiModelView[]> {
    const plan = await this.plans.forUser(userId);

    return (
      await this.aiModels.find({
        where: { isEnabled: true },
        order: { tier: 'ASC', displayName: 'ASC' },
      })
    )
      .filter((m) => tierWithin(plan.modelTier, m.tier))
      .map((m) => ({
        Id: m.id,
        Name: m.displayName,
        Description: m.description,
        Tier: m.tier,
        IsDefault: m.isDefault,
      }));
  }
}
