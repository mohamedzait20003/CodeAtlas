import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Generation } from '@/modules/generations/entities/generation.entity';
import { Repo } from '@/modules/generations/entities/repo.entity';
import { UsageCounter } from '@/modules/subscription/entities/usage-counter.entity';
import { User } from '@/modules/identity/entities/user.entity';
import { EncryptionService } from '@/modules/identity/services/encryption.service';
import { LlmProviderFactory } from '@/shared/Factories/llm-provider.factory';
import { RepoContentService } from './services/repo-content.service';
import { RepoReadmeAgentService } from './services/repo-readme-agent.service';
import { RepoGenerationRunner } from './services/repo-generation-runner.service';

/**
 * "Compose a README" (repo README) worker providers. Independent of the
 * profile {@link ProfileWorkerModule} — its own runner, queue, and consumer —
 * so repo generation scales and fails on its own. DB + config come from the
 * parent {@link WorkersModule}.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Generation, Repo, UsageCounter, User])],
  providers: [
    RepoGenerationRunner,
    RepoContentService,
    RepoReadmeAgentService,
    EncryptionService,
    LlmProviderFactory,
  ],
  exports: [RepoGenerationRunner],
})
export class RepoWorkerModule {}
