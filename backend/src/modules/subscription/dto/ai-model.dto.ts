import type { ModelTier } from '@/shared/Domain/enums/model-tier.enum';

/** An AI model the signed-in user may pick (subset of the catalog). */
export interface AiModelView {
  Id: string;
  Name: string;
  Description: string | null;
  Tier: ModelTier;
  IsDefault: boolean;
}
