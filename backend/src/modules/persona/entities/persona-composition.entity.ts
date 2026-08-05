import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';
import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';
import { PushMode } from '@/shared/Domain/enums/push-mode.enum';

/**
 * One "Compose Your Profile" job — the profile README aggregated from the user's
 * résumé + all their repos. Written by the persona worker. (Enum columns reuse the
 * shared `generation_status_enum` / `push_mode_enum` / `llm_provider_enum` types.)
 */
@Entity({ name: 'persona_compositions' })
export class PersonaComposition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne('UserProfile')
  @JoinColumn({ name: 'user_id' })
  profile: any;

  /** Optional résumé this run drew from (null = none saved). */
  @Column({ type: 'uuid', name: 'resume_id', nullable: true })
  resumeId: string | null;

  @ManyToOne('Resume', { nullable: true })
  @JoinColumn({ name: 'resume_id' })
  resume: any;

  /** The user's steering brief, rendered to text. */
  @Column({ type: 'text', nullable: true })
  intent: string | null;

  @Column({
    type: 'enum',
    enum: GenerationStatus,
    default: GenerationStatus.QUEUED,
  })
  status: GenerationStatus;

  /** Fine-grained progress within a running job (gathering/analyzing/drafting/…). */
  @Column({ type: 'text', nullable: true })
  phase: string | null;

  @Column({ type: 'uuid', name: 'ai_model_id', nullable: true })
  aiModelId: string | null;

  @ManyToOne('AiModel', { nullable: true })
  @JoinColumn({ name: 'ai_model_id' })
  aiModel: any;

  @Column({ type: 'enum', enum: LlmProvider, nullable: true })
  provider: LlmProvider | null;

  @Column({ type: 'text', nullable: true })
  model: string | null;

  @Column({
    type: 'enum',
    enum: PushMode,
    name: 'push_mode',
    default: PushMode.MANUAL,
  })
  pushMode: PushMode;

  @Column({ type: 'text', name: 'generated_md', nullable: true })
  generatedMd: string | null;

  @Column({ type: 'text', name: 'pr_url', nullable: true })
  prUrl: string | null;

  @Column({ type: 'text', name: 'commit_sha', nullable: true })
  commitSha: string | null;

  @Column({ type: 'int', name: 'input_tokens', nullable: true })
  inputTokens: number | null;

  @Column({ type: 'int', name: 'output_tokens', nullable: true })
  outputTokens: number | null;

  /** Credits held for this run at enqueue; released when it settles or fails. */
  @Column({ type: 'int', name: 'credits_held', default: 0 })
  creditsHeld: number;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;
}
