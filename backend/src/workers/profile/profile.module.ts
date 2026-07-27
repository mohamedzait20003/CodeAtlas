import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PersonaComposition } from '@/modules/persona/entities/persona-composition.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { User } from '@/modules/identity/entities/user.entity';
import { Resume } from '@/modules/resumes/entities/resume.entity';
import { EncryptionService } from '@/modules/identity/services/encryption.service';
import { R2StorageService } from '@/modules/resumes/services/r2-storage.service';
import { LlmProviderFactory } from '@/shared/Factories/llm-provider.factory';
import { ResumeTextService } from './services/resume-text.service';
import { GithubReaderService } from './services/github-reader.service';
import { ProfileContextService } from './services/profile-context.service';
import { ProfileReadmeAgentService } from './services/profile-readme-agent.service';
import { ProfileGenerationRunner } from './services/profile-generation-runner.service';

/**
 * "Compose Your Profile" (profile README) worker providers. The DB connection +
 * config come from the parent {@link WorkersModule}; this only registers the
 * repositories + services it uses. Repo-README generation lives in its own
 * {@link RepoWorkerModule}.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PersonaComposition, UsageCounter, User, Resume]),
  ],
  providers: [
    ProfileGenerationRunner,
    ProfileContextService,
    GithubReaderService,
    ResumeTextService,
    R2StorageService,
    EncryptionService,
    LlmProviderFactory,
    ProfileReadmeAgentService,
  ],
  exports: [ProfileGenerationRunner],
})
export class ProfileWorkerModule {}
