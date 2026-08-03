import 'reflect-metadata';
import AppDataSource from '../../data-source';
import { seedPlans } from './plans.seed';
import { seedAdmin } from './admin.seed';
import { seedAiModels } from './ai-models.seed';
import { seedPlanPrices } from './plan-prices.seed';

async function main() {
  await AppDataSource.initialize();
  try {
    await seedPlans(AppDataSource);
    await seedAdmin(AppDataSource);
    await seedAiModels(AppDataSource);
    await seedPlanPrices(AppDataSource);
    console.log('Seed complete.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
