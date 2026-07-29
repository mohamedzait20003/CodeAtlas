import { Body, Controller, Post } from '@nestjs/common';

import {
  COMPOSITIONS_ROUTE,
  PersonaBaseController,
} from './persona-base.controller';
import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { Quota } from '@/shared/Decorators/quota.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import { QuotaKind } from '@/shared/Domain/enums/quota-kind.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { PersonaCompositionService } from '@/modules/persona/services/persona-composition.service';
import { StartCompositionDto } from '@/modules/persona/dto/start-composition.dto';
import type { CompositionStartView } from '@/modules/persona/dto/composition.dto';

/** POST /compositions — start a "Compose Your Profile" job (reserves the quota). */
@Controller(COMPOSITIONS_ROUTE)
export class StartCompositionController extends PersonaBaseController {
  constructor(private readonly composition: PersonaCompositionService) {
    super();
  }

  @Quota(QuotaKind.PROFILE_COMPOSITION)
  @Roles(UserRole.USER)
  @Post()
  async start(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartCompositionDto,
  ): Promise<ApiResponse<CompositionStartView>> {
    return this.ok(
      await this.composition.start(user.userId, dto),
      'Composition started.',
    );
  }
}
