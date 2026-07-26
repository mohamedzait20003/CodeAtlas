import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BaseQueueFactory } from '@/shared/Factories/base-queue.factory';

export interface RepoGenerationJob {
  generationId: string;
}

export const REPO_GENERATION_QUEUE = 'repo-generation';

/**
 * Queue for "Compose a README" jobs. Kept separate from the profile
 * {@link ProfileGenerationFactory} so repo-README generation runs on its own worker with
 * independent concurrency — a burst of repo jobs never starves profile compositions.
 */
@Injectable()
export class RepoGenerationFactory extends BaseQueueFactory<RepoGenerationJob> {
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
