import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BaseQueueFactory } from '@/shared/Factories/base-queue.factory';

export interface ProfileGenerationJob {
  generationId: string;
}

export const PROFILE_GENERATION_QUEUE = 'profile-generation';

/** Enqueues "Compose Your Profile" jobs onto the persona worker's queue. */
@Injectable()
export class PersonaCompositionFactory extends BaseQueueFactory<ProfileGenerationJob> {
  constructor(config: ConfigService) {
    super(config, PROFILE_GENERATION_QUEUE, 'profile.generate', {
      attempts: 1,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    });
  }

  async queue(generationId: string): Promise<void> {
    await this.enqueue({ generationId });
  }
}
