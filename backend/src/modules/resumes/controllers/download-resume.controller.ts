import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { ResumeService } from '@/modules/resumes/services/resume.service';
import type { ResumeDownloadView } from '@/modules/resumes/dto/resume.dto';
import { RESUMES_ROUTE, ResumeBaseController } from './resume-base.controller';

/** GET /resumes/:id/download — a short-lived presigned URL (uploads) or the link. */
@Controller(RESUMES_ROUTE)
export class DownloadResumeController extends ResumeBaseController {
  constructor(private readonly resumes: ResumeService) {
    super();
  }

  @Roles(UserRole.USER)
  @Get(':id/download')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ResumeDownloadView>> {
    return this.ok({ Url: await this.resumes.downloadUrl(user.userId, id) });
  }
}
