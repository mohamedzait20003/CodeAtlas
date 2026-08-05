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
      name: 'Free',
      description: 'Get started with no commitment.',
      ctaLabel: 'Start for free',
      highlight: false,
      sortOrder: 0,
      priceMonthly: 0,
      // Weekly credits (1 credit ≈ 1k weighted LLM tokens); resets Monday.
      weeklyCredits: 300,
      modelTier: ModelTier.ECONOMY,
      model: 'claude-haiku-4-5-20251001',
      features: {
        privateRepos: false,
        bulkGenerate: false,
        directPush: false,
        watermark: true,
        customTemplates: 0,
        historyRetentionDays: 7,
        apiAccess: false,
        support: 'Community',
      },
    },
    {
      tier: PlanTier.STARTER,
      name: 'Starter',
      description: 'For developers who ship regularly.',
      ctaLabel: 'Start Starter',
      highlight: true,
      sortOrder: 1,
      priceMonthly: 900,
      weeklyCredits: 3000,
      modelTier: ModelTier.STANDARD,
      model: 'claude-sonnet-4-6',
      features: {
        privateRepos: true,
        bulkGenerate: false,
        directPush: false,
        watermark: false,
        customTemplates: 1,
        historyRetentionDays: 90,
        apiAccess: false,
        support: 'Email',
      },
    },
    {
      tier: PlanTier.PRO,
      name: 'Pro',
      description: 'For teams and power users.',
      ctaLabel: 'Start Pro',
      highlight: false,
      sortOrder: 2,
      priceMonthly: 2900,
      weeklyCredits: 15000,
      modelTier: ModelTier.PREMIUM,
      model: 'claude-opus-4-8',
      features: {
        privateRepos: true,
        bulkGenerate: true,
        directPush: true,
        watermark: false,
        customTemplates: -1,
        historyRetentionDays: -1,
        apiAccess: true,
        support: 'Priority',
      },
    },
  ]);

  console.log('Plans seeded.');
}
