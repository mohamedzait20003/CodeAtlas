import { Body, Controller, Param, Post } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { Quota } from '@/shared/Decorators/quota.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import { QuotaKind } from '@/shared/Domain/enums/quota-kind.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import { ProjectCompositionService } from '@/modules/project/services/project-composition.service';
import { StartRepoCompositionDto } from '@/modules/project/dto/start-repo-composition.dto';
import type { CompositionStartView } from '@/modules/project/dto/composition.dto';
import { REPOS_ROUTE, ProjectBaseController } from './project-base.controller';

/** POST /repos/:id/generate — start a "Compose a README" job (reserves the quota). */
@Controller(REPOS_ROUTE)
export class GenerateCompositionController extends ProjectBaseController {
  constructor(private readonly projectGen: ProjectCompositionService) {
    super();
  }

  @Quota(QuotaKind.REPO_GENERATION)
  @Roles(UserRole.USER)
  @Post(':id/generate')
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: StartRepoCompositionDto,
  ): Promise<CompositionStartView> {
    return this.projectGen.start(user.userId, id, dto);
  }
}
