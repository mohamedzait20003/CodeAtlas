import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import { GithubReposService } from '@/modules/project/services/github-repos.service';
import { ProjectCompositionService } from '@/modules/project/services/project-composition.service';
import type { RepoItem } from '@/modules/project/dto/repo.dto';
import { REPOS_ROUTE, ProjectBaseController } from './project-base.controller';

/** GET /repos/:id — one repo (by GitHub id) enriched with its composition status. */
@Controller(REPOS_ROUTE)
export class RepoDetailController extends ProjectBaseController {
  constructor(
    private readonly repos: GithubReposService,
    private readonly projectGen: ProjectCompositionService,
  ) {
    super();
  }

  @Roles(UserRole.USER)
  @Get(':id')
  async detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<RepoItem> {
    const item = await this.repos.findById(user.userId, id);
    if (!item) throw new NotFoundException('Repository not found.');
    const [enriched] = await this.projectGen.attachStatus(user.userId, [item]);
    return enriched;
  }
}
