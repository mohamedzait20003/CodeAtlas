import { Body, Controller, Param, Post } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { Credits, HeldCredits } from '@/shared/Decorators/credits.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import { CreditAction } from '@/shared/Domain/enums/credit-action.enum';
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

  @Credits(CreditAction.PROJECT_COMPOSITION)
  @Roles(UserRole.USER)
  @Post(':id/generate')
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: StartRepoCompositionDto,
    @HeldCredits() creditsHeld: number,
  ): Promise<CompositionStartView> {
    return this.projectGen.start(user.userId, id, dto, creditsHeld);
  }
}
