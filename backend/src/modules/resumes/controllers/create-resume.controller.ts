import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Roles } from '@/shared/Decorators/auth-role.decorator';
import { CurrentUser } from '@/shared/Decorators/current-user.decorator';
import { UserRole } from '@/shared/Domain/enums/user-role.enum';
import type { AuthenticatedUser } from '@/shared/Contracts/authenticated-user.contract';
import type { ApiResponse } from '@/shared/Domain/base.controller';
import { ResumeService } from '@/modules/resumes/services/resume.service';
import { CreateResumeDto } from '@/modules/resumes/dto/create-resume.dto';
import type {
  ResumeView,
  UploadedResumeFile,
} from '@/modules/resumes/dto/resume.dto';
import { RESUMES_ROUTE, ResumeBaseController } from './resume-base.controller';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** POST /resumes — save a résumé (uploaded file or a shared link). */
@Controller(RESUMES_ROUTE)
export class CreateResumeController extends ResumeBaseController {
  constructor(private readonly resumes: ResumeService) {
    super();
  }

  @Roles(UserRole.USER)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }),
  )
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateResumeDto,
    @UploadedFile() file?: UploadedResumeFile,
  ): Promise<ApiResponse<ResumeView>> {
    return this.ok(
      await this.resumes.create(user.userId, dto, file),
      'Résumé saved.',
    );
  }
}
