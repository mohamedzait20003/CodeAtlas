import { DataSource } from 'typeorm';
import { Plan } from '@/modules/subscription/entities/plan.entity';
import { PlanPrice } from '@/modules/subscription/entities/plan-price.entity';
import { PlanTier } from '@/shared/Domain';

const GATEWAY = 'stripe';

/**
 * Per (tier, interval) Stripe prices. `priceRef` must be a real Stripe Price id
 * for live checkout — set STRIPE_PRICE_* in .env; otherwise a placeholder is
 * stored so the schema/flow work (checkout will 400 until real ids are set).
 * Amounts are display-only minor units.
 */
const CATALOG = [
  { tier: PlanTier.STARTER, interval: 'month', amount: 900, env: 'STRIPE_PRICE_STARTER_MONTH' },
  { tier: PlanTier.STARTER, interval: 'year', amount: 9000, env: 'STRIPE_PRICE_STARTER_YEAR' },
  { tier: PlanTier.PRO, interval: 'month', amount: 2900, env: 'STRIPE_PRICE_PRO_MONTH' },
  { tier: PlanTier.PRO, interval: 'year', amount: 29000, env: 'STRIPE_PRICE_PRO_YEAR' },
];

export async function seedPlanPrices(dataSource: DataSource): Promise<void> {
  const priceRepo = dataSource.getRepository(PlanPrice);
  if ((await priceRepo.count()) > 0) return;

  const plans = await dataSource.getRepository(Plan).find();
  const byTier = new Map(plans.map((p) => [p.tier, p]));

  const rows = CATALOG.flatMap((c) => {
    const plan = byTier.get(c.tier);
    if (!plan) return [];
    return [
      priceRepo.create({
        planId: plan.id,
        gateway: GATEWAY,
        interval: c.interval,
        priceRef:
          process.env[c.env] ?? `price_${c.tier}_${c.interval}_placeholder`,
        amount: c.amount,
        currency: 'usd',
      }),
    ];
  });

  await priceRepo.save(rows);
  console.log('Plan prices seeded (stripe).');
}
