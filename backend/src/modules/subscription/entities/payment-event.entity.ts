import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Idempotency ledger for gateway webhooks (Commit 2 consumes these). Gateways
 * deliver events at-least-once, so `(gateway, event_id)` is unique — a duplicate
 * delivery is a no-op. The raw payload is kept for auditing/replay.
 */
@Index(['gateway', 'eventId'], { unique: true })
@Entity({ name: 'payment_events' })
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  gateway: string;

  /** The gateway's own event id. */
  @Column({ type: 'text', name: 'event_id' })
  eventId: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'jsonb' })
  payload: unknown;

  @CreateDateColumn({ name: 'received_at' })
  receivedAt: Date;

  @Column({ type: 'timestamptz', name: 'processed_at', nullable: true })
  processedAt: Date | null;
}
