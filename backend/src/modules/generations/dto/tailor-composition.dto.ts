import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Body for POST /compositions/tailor — the user's rough note to sharpen. */
export class TailorCompositionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  draft: string;
}
