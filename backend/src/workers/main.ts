import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Worker, type Job } from 'bullmq';
import { Redis, type RedisOptions } from 'ioredis';

import {
  PROFILE_GENERATION_QUEUE,
  type ProfileGenerationJob,
} from '@/modules/persona/factories/persona-composition.factory';
import {
  REPO_GENERATION_QUEUE,
  type RepoGenerationJob,
} from '@/modules/project/factories/project-composition.factory';
import { WorkersModule } from './workers.module';
import { RendererService } from './mail/services/renderer.service';
import { SenderService } from './mail/services/sender.service';
import { ProfileGenerationRunner } from './profile/services/profile-generation-runner.service';
import { RepoGenerationRunner } from './repo/services/repo-generation-runner.service';
import type { EmailJobPayload } from './mail/types';

const REDIS_OPTS: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const intEnv = (name: string, fallback: number): number =>
  parseInt(process.env[name] ?? String(fallback), 10);

/** Boots one Nest context and starts every background worker (mail + profile + repo). */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkersModule, {
    logger: ['log', 'warn', 'error'],
  });

  const renderer = app.get(RendererService);
  const sender = app.get(SenderService);
  const profileRunner = app.get(ProfileGenerationRunner);
  const repoRunner = app.get(RepoGenerationRunner);

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  // Each worker gets its own connection (bullmq uses blocking commands).
  const mailConnection = new Redis(redisUrl, REDIS_OPTS);
  const profileConnection = new Redis(redisUrl, REDIS_OPTS);
  const repoConnection = new Redis(redisUrl, REDIS_OPTS);

  const mailWorker = new Worker<EmailJobPayload>(
    'email',
    async (job: Job<EmailJobPayload>) => {
      const html = renderer.render(job.data.view, job.data.data);
      await sender.send(job.data, html);
    },
    {
      connection: mailConnection,
      concurrency: intEnv('MAIL_WORKER_CONCURRENCY', 5),
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  );

  const profileWorker = new Worker<ProfileGenerationJob>(
    PROFILE_GENERATION_QUEUE,
    async (job: Job<ProfileGenerationJob>) => {
      await profileRunner.run(job.data.generationId);
    },
    {
      connection: profileConnection,
      concurrency: intEnv('PROFILE_WORKER_CONCURRENCY', 2),
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  );

  const repoWorker = new Worker<RepoGenerationJob>(
    REPO_GENERATION_QUEUE,
    async (job: Job<RepoGenerationJob>) => {
      await repoRunner.run(job.data.generationId);
    },
    {
      connection: repoConnection,
      concurrency: intEnv('REPO_WORKER_CONCURRENCY', 2),
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  );

  mailWorker.on('failed', (job, err) =>
    console.error(`[workers:mail] ✗ ${job?.id}: ${err.message}`),
  );
  profileWorker.on('failed', (job, err) =>
    console.error(`[workers:profile] ✗ ${job?.id}: ${err.message}`),
  );
  repoWorker.on('failed', (job, err) =>
    console.error(`[workers:repo] ✗ ${job?.id}: ${err.message}`),
  );

  console.log('[workers] Ready — mail + profile + repo');

  const shutdown = async () => {
    await Promise.all([
      mailWorker.close(),
      profileWorker.close(),
      repoWorker.close(),
    ]);
    await Promise.all([
      mailConnection.quit(),
      profileConnection.quit(),
      repoConnection.quit(),
    ]);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

void bootstrap();
