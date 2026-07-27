import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_profiles' })
export class UserProfile {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'text', name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string | null;

  /**
   * Back-reference to the auth row.
   */
  @OneToOne('User', 'profile')
  @JoinColumn({ name: 'id' })
  user: any;

  /**
   * The user's active subscription (FK is on the subscriptions side).
   * Load explicitly; plan details are available via subscription.plan (eager).
   */
  @OneToOne('Subscription', 'profile', { cascade: ['remove'], nullable: true })
  subscription: any;

  @OneToMany('UsageCounter', 'profile')
  usageCounters: any[];

  @OneToMany('Resume', 'profile')
  resumes: any[];

  @OneToMany('Repo', 'profile')
  repos: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
