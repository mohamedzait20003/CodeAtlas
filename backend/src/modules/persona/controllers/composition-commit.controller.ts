import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';

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
import { CommitCompositionDto } from '@/modules/persona/dto/commit-composition.dto';
import type { CommitView } from '@/modules/persona/dto/composition.dto';

/** POST /compositions/:id/commit — push the (edited) README to the profile repo. */
@Controller(COMPOSITIONS_ROUTE)
export class CompositionCommitController extends PersonaBaseController {
  constructor(private readonly composition: PersonaCompositionService) {
    super();
  }

  @Roles(UserRole.USER)
  @Post(':id/commit')
  async commit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommitCompositionDto,
  ): Promise<ApiResponse<CommitView>> {
    return this.ok(
      await this.composition.commit(user.userId, id, dto.content),
      'Committed to your profile.',
    );
  }
}
