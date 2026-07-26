import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { Quota } from '@/shared/Decorators/quota.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import { QuotaKind } from '@/shared/Domain/enums/quota-kind.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { PagedResult } from '@/shared/Common/paged-result';
import { GithubReposService } from '@/modules/generations/services/github-repos.service';
import { RepoGenerationService } from '@/modules/generations/services/repo-generation.service';
import { ListReposQuery } from '@/modules/generations/dto/list-repos.query';
import { StartRepoCompositionDto } from '@/modules/generations/dto/start-repo-composition.dto';
import { CommitCompositionDto } from '@/modules/generations/dto/commit-composition.dto';
import type { RepoItem } from '@/modules/generations/dto/repo.dto';
import type {
  CommitView,
  CompositionStartView,
  CompositionView,
} from '@/modules/generations/dto/composition.dto';

@Controller('repos')
export class ReposController {
  constructor(
    private readonly repos: GithubReposService,
    private readonly repoGen: RepoGenerationService,
  ) {}

  /**
   * Paged list of the signed-in user's own GitHub repositories (excluding the
   * profile repo). Reads only the caller's own token — no userId is accepted.
   */
  @Roles(UserRole.USER)
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReposQuery,
  ): Promise<PagedResult<RepoItem>> {
    return this.repos.list(user.userId, query.page, query.pageSize);
  }

  /** Start a "Compose a README" job for one repo (`id` = its GitHub repo id). */
  @Quota(QuotaKind.REPO_GENERATION)
  @Roles(UserRole.USER)
  @Post(':id/generate')
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: StartRepoCompositionDto,
  ): Promise<CompositionStartView> {
    return this.repoGen.start(user.userId, id, dto);
  }

  /** Poll a repo-README generation until it completes (`id` = generation uuid). */
  @Roles(UserRole.USER)
  @Get('generations/:id')
  status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompositionView> {
    return this.repoGen.status(user.userId, id);
  }

  /** Push the edited README straight to the target repo's default branch. */
  @Roles(UserRole.USER)
  @Post('generations/:id/commit')
  commit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommitCompositionDto,
  ): Promise<CommitView> {
    return this.repoGen.commit(user.userId, id, dto.content);
  }
}
