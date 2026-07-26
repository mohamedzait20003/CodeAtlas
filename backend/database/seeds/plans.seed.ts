import { DataSource } from 'typeorm';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { ModelTier, PlanTier } from '@/shared/Domain';

export async function seedPlans(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Plan);
  const existing = await repo.count();
  if (existing > 0) return;

  await repo.save([
    {
      tier: PlanTier.FREE,
      priceMonthly: 0,
      repoLimit: 3,
      // Per-repo README generations per month.
      generationLimit: 5,
      // Saved résumés (delete to swap on Free).
      resumeLimit: 1,
      modelTier: ModelTier.ECONOMY,
      model: 'claude-haiku-4-5-20251001',
      features: {
        privateRepos: false,
        bulkGenerate: false,
        directPush: false,
        watermark: true,
        profileCompositions: 1,
        customTemplates: 0,
        historyRetentionDays: 7,
        apiAccess: false,
      },
    },
    {
      tier: PlanTier.STARTER,
      priceMonthly: 900,
      repoLimit: 25,
      generationLimit: 75,
      resumeLimit: 5,
      modelTier: ModelTier.STANDARD,
      model: 'claude-sonnet-4-6',
      features: {
        privateRepos: true,
        bulkGenerate: false,
        directPush: false,
        watermark: false,
        profileCompositions: 4,
        customTemplates: 1,
        historyRetentionDays: 90,
        apiAccess: false,
      },
    },
    {
      tier: PlanTier.PRO,
      priceMonthly: 2900,
      repoLimit: -1,
      generationLimit: 750,
      resumeLimit: -1,
      modelTier: ModelTier.PREMIUM,
      model: 'claude-opus-4-8',
      features: {
        privateRepos: true,
        bulkGenerate: true,
        directPush: true,
        watermark: false,
        profileCompositions: -1,
        customTemplates: -1,
        historyRetentionDays: -1,
        apiAccess: true,
      },
    },
  ]);

  console.log('Plans seeded.');
}
