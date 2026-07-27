import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Body for POST /compositions/:id/commit — the (edited) README markdown to push. */
export class CommitCompositionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  content: string;
}
