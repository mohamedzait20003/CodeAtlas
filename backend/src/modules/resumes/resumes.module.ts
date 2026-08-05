import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Resume } from '@/modules/resumes/entities/resume.entity';
import { IdentityModule } from '@/modules/identity/identity.module';
import { AuthGuard } from '@/shared/Guards/auth.guard';

import { ListResumesController } from '@/modules/resumes/controllers/list-resumes.controller';
import { CreateResumeController } from '@/modules/resumes/controllers/create-resume.controller';
import { DownloadResumeController } from '@/modules/resumes/controllers/download-resume.controller';
import { DeleteResumeController } from '@/modules/resumes/controllers/delete-resume.controller';
import { ResumeService } from '@/modules/resumes/services/resume.service';
import { R2StorageService } from '@/shared/Services/r2-storage.service';

/** Résumé storage — upload or link. Unlimited; usage is metered in credits. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Resume]),
    // Provides TOKEN_SERVICE for AuthGuard.
    IdentityModule,
  ],
  controllers: [
    ListResumesController,
    CreateResumeController,
    DownloadResumeController,
    DeleteResumeController,
  ],
  providers: [ResumeService, R2StorageService, AuthGuard],
})
export class ResumesModule {}
