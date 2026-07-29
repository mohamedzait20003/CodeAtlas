import { Controller, Get, Query } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { PagedResult } from '@/shared/Common/paged-result';
import { GithubReposService } from '@/modules/project/services/github-repos.service';
import { ProjectCompositionService } from '@/modules/project/services/project-composition.service';
import { ListReposQuery } from '@/modules/project/dto/list-repos.query';
import type { RepoItem } from '@/modules/project/dto/repo.dto';
import { REPOS_ROUTE, ProjectBaseController } from './project-base.controller';

/**
 * GET /repos — the signed-in user's own GitHub repositories (excluding the profile
 * repo), each enriched with its latest README composition status.
 */
@Controller(REPOS_ROUTE)
export class ListReposController extends ProjectBaseController {
  constructor(
    private readonly repos: GithubReposService,
    private readonly projectGen: ProjectCompositionService,
  ) {
    super();
  }

  @Roles(UserRole.USER)
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReposQuery,
  ): Promise<PagedResult<RepoItem>> {
    const page = await this.repos.list(user.userId, query.page, query.pageSize);
    const Items = await this.projectGen.attachStatus(user.userId, page.Items);
    return { ...page, Items };
  }
}
