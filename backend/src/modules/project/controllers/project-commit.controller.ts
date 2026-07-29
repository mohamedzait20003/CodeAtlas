import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import { ProjectCompositionService } from '@/modules/project/services/project-composition.service';
import { CommitCompositionDto } from '@/modules/project/dto/commit-composition.dto';
import type { CommitView } from '@/modules/project/dto/composition.dto';
import { REPOS_ROUTE, ProjectBaseController } from './project-base.controller';

/** POST /repos/generations/:id/commit — push the edited README to the target repo. */
@Controller(REPOS_ROUTE)
export class ProjectCommitController extends ProjectBaseController {
  constructor(private readonly projectGen: ProjectCompositionService) {
    super();
  }

  @Roles(UserRole.USER)
  @Post('generations/:id/commit')
  commit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommitCompositionDto,
  ): Promise<CommitView> {
    return this.projectGen.commit(user.userId, id, dto.content);
  }
}
