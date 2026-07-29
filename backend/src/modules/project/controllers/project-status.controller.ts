import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import { ProjectCompositionService } from '@/modules/project/services/project-composition.service';
import type { CompositionView } from '@/modules/project/dto/composition.dto';
import { REPOS_ROUTE, ProjectBaseController } from './project-base.controller';

/** GET /repos/generations/:id — poll a repo composition until it's terminal. */
@Controller(REPOS_ROUTE)
export class ProjectStatusController extends ProjectBaseController {
  constructor(private readonly projectGen: ProjectCompositionService) {
    super();
  }

  @Roles(UserRole.USER)
  @Get('generations/:id')
  status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompositionView> {
    return this.projectGen.status(user.userId, id);
  }
}
