import { Controller, Get } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { ResumeService } from '@/modules/resumes/services/resume.service';
import type { ResumeListView } from '@/modules/resumes/dto/resume.dto';
import { RESUMES_ROUTE, ResumeBaseController } from './resume-base.controller';

/** GET /resumes — the signed-in user's saved résumés. */
@Controller(RESUMES_ROUTE)
export class ListResumesController extends ResumeBaseController {
  constructor(private readonly resumes: ResumeService) {
    super();
  }

  @Roles(UserRole.USER)
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<ResumeListView>> {
    return this.ok(await this.resumes.list(user.userId));
  }
}
