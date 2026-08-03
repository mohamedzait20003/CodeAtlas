import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionStatus } from '@/shared/Domain/enums/subscription-status.enum';

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @OneToOne('UserProfile', 'subscription')
  @JoinColumn({ name: 'user_id' })
  profile: any;

  @Column({ type: 'uuid', name: 'plan_id' })
  planId: string;

  @ManyToOne('Plan', 'subscriptions', { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: any;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  status: SubscriptionStatus;

  /** Which payment gateway owns this subscription ('stripe', 'paymob', …). */
  @Column({ type: 'text', nullable: true })
  gateway: string | null;

  /** The gateway's own subscription id (Stripe subscription, Paymob order, …). */
  @Column({ type: 'text', name: 'gateway_ref', nullable: true })
  gatewayRef: string | null;

  /** Billing interval: 'month' | 'year'. */
  @Column({ type: 'text', nullable: true })
  interval: string | null;

  @Column({ type: 'timestamptz', name: 'current_period_end', nullable: true })
  currentPeriodEnd: Date | null;

  /** Set when the user cancels — access is kept until `effectiveEndAt`. */
  @Column({
    type: 'boolean',
    name: 'cancel_at_period_end',
    default: false,
  })
  cancelAtPeriodEnd: boolean;

  /** When a cancelled subscription actually ends (end of the current month). */
  @Column({ type: 'timestamptz', name: 'effective_end_at', nullable: true })
  effectiveEndAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
