import { Body, Controller, Post } from '@nestjs/common';

import {
  COMPOSITIONS_ROUTE,
  PersonaBaseController,
} from './persona-base.controller';
import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { Credits, HeldCredits } from '@/shared/Decorators/credits.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import { CreditAction } from '@/shared/Domain/enums/credit-action.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { PersonaCompositionService } from '@/modules/persona/services/persona-composition.service';
import { StartCompositionDto } from '@/modules/persona/dto/start-composition.dto';
import type { CompositionStartView } from '@/modules/persona/dto/composition.dto';

/** POST /compositions — start a "Compose Your Profile" job (holds credits). */
@Controller(COMPOSITIONS_ROUTE)
export class StartCompositionController extends PersonaBaseController {
  constructor(private readonly composition: PersonaCompositionService) {
    super();
  }

  @Credits(CreditAction.PROFILE_COMPOSITION)
  @Roles(UserRole.USER)
  @Post()
  async start(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartCompositionDto,
    @HeldCredits() creditsHeld: number,
  ): Promise<ApiResponse<CompositionStartView>> {
    return this.ok(
      await this.composition.start(user.userId, dto, creditsHeld),
      'Composition started.',
    );
  }
}
