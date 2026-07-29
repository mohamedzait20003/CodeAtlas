import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import {
  COMPOSITIONS_ROUTE,
  PersonaBaseController,
} from './persona-base.controller';
import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { PersonaCompositionService } from '@/modules/persona/services/persona-composition.service';
import type { CompositionView } from '@/modules/persona/dto/composition.dto';

/** GET /compositions/:id — poll a composition until it reaches a terminal state. */
@Controller(COMPOSITIONS_ROUTE)
export class CompositionStatusController extends PersonaBaseController {
  constructor(private readonly composition: PersonaCompositionService) {
    super();
  }

  @Roles(UserRole.USER)
  @Get(':id')
  async status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<CompositionView>> {
    return this.ok(await this.composition.status(user.userId, id));
  }
}
