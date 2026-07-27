import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BaseQueueFactory } from '@/shared/Factories/base-queue.factory';

export interface RepoGenerationJob {
  generationId: string;
}

export const REPO_GENERATION_QUEUE = 'repo-generation';

/** Enqueues "Compose a README" jobs onto the project worker's queue. */
@Injectable()
export class ProjectCompositionFactory extends BaseQueueFactory<RepoGenerationJob> {
  constructor(config: ConfigService) {
    super(config, REPO_GENERATION_QUEUE, 'repo.generate', {
      attempts: 1,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    });
  }

  async queue(generationId: string): Promise<void> {
    await this.enqueue({ generationId });
  }
}
