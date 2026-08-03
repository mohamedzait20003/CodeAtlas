import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A plan's price for one (gateway, interval) — e.g. Starter / Stripe / month.
 * `priceRef` is the gateway's own price identifier (Stripe Price id, Paymob
 * integration id, …). Keeping this per-gateway lets a plan be sold through
 * several gateways without touching the plan itself.
 */
@Index(['planId', 'gateway', 'interval'], { unique: true })
@Entity({ name: 'plan_prices' })
export class PlanPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'plan_id' })
  planId: string;

  @ManyToOne('Plan')
  @JoinColumn({ name: 'plan_id' })
  plan: any;

  /** Gateway key: 'stripe' | 'paymob' | 'hyperpay' | … */
  @Column({ type: 'text' })
  gateway: string;

  /** 'month' | 'year' */
  @Column({ type: 'text' })
  interval: string;

  /** The gateway's price identifier used when creating checkout. */
  @Column({ type: 'text', name: 'price_ref' })
  priceRef: string;

  /** Display amount in minor units (e.g. cents/piastres). */
  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'text', default: 'usd' })
  currency: string;
}
