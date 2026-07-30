import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectComposition } from '@/modules/project/entities/project-composition.entity';
import { Repo } from '@/modules/project/entities/repo.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { User } from '@/modules/identity/entities/user.entity';
import { EncryptionService } from '@/shared/Services/encryption.service';
import { LlmProviderFactory } from '@/shared/Factories/llm-provider.factory';
import { ProjectContentService } from './services/project-content.service';
import { ProjectReadmeAgentService } from './services/project-readme-agent.service';
import { ProjectGenerationRunner } from './services/project-generation-runner.service';

/**
 * "Compose a README" (repo README) worker providers. Independent of the
 * profile {@link PersonaWorkerModule} — its own runner, queue, and consumer —
 * so repo generation scales and fails on its own. DB + config come from the
 * parent {@link JobsModule}.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectComposition, Repo, UsageCounter, User]),
  ],
  providers: [
    ProjectGenerationRunner,
    ProjectContentService,
    ProjectReadmeAgentService,
    EncryptionService,
    LlmProviderFactory,
  ],
  exports: [ProjectGenerationRunner],
})
export class ProjectWorkerModule {}
