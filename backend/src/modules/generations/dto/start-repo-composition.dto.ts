import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { RepoBrief } from './brief.dto';

/** Body for POST /repos/:id/generate — both optional (brief steers, model defaults). */
export class StartRepoCompositionDto {
  /** Structured steering for the repo README (project type, audience, sections, …). */
  @IsOptional()
  @ValidateNested()
  @Type(() => RepoBrief)
  brief?: RepoBrief;

  /** Chosen AI model (from GET /ai-models). Validated against the caller's plan tier. */
  @IsOptional()
  @IsUUID()
  modelId?: string;
}
