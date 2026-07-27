import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Body for POST /repos/generations/:id/commit — the (edited) README to push. */
export class CommitCompositionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  content: string;
}
