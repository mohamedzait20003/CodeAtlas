import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { ProfileBrief } from './brief.dto';

/** Body for POST /compositions — both optional (brief steers, model defaults). */
export class StartCompositionDto {
  /** Structured steering for the profile README (role, audience, sections, …). */
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileBrief)
  brief?: ProfileBrief;

  /** Chosen AI model (from GET /ai-models). Validated against the caller's plan tier. */
  @IsOptional()
  @IsUUID()
  modelId?: string;
}
