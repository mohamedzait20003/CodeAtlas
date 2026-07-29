import { Body, Controller, Post } from '@nestjs/common';

import {
  COMPOSITIONS_ROUTE,
  PersonaBaseController,
} from './persona-base.controller';
import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { PersonaTailorService } from '@/modules/persona/services/persona-tailor.service';
import { TailorCompositionDto } from '@/modules/persona/dto/tailor-composition.dto';
import type { TailorView } from '@/modules/persona/dto/composition.dto';

/** POST /compositions/tailor — sharpen a rough steering note (synchronous). */
@Controller(COMPOSITIONS_ROUTE)
export class TailorCompositionController extends PersonaBaseController {
  constructor(private readonly tailorService: PersonaTailorService) {
    super();
  }

  @Roles(UserRole.USER)
  @Post('tailor')
  async tailor(
    @Body() dto: TailorCompositionDto,
  ): Promise<ApiResponse<TailorView>> {
    return this.ok(await this.tailorService.tailor(dto.draft));
  }
}
