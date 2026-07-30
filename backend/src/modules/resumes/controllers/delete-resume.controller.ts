import { Controller, Delete, Param, ParseUUIDPipe } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { ResumeService } from '@/modules/resumes/services/resume.service';
import { RESUMES_ROUTE, ResumeBaseController } from './resume-base.controller';

/** DELETE /resumes/:id — remove a saved résumé. */
@Controller(RESUMES_ROUTE)
export class DeleteResumeController extends ResumeBaseController {
  constructor(private readonly resumes: ResumeService) {
    super();
  }

  @Roles(UserRole.USER)
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    await this.resumes.remove(user.userId, id);
    return this.message('Résumé deleted.');
  }
}
