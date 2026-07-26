import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GenerationStatus } from '@/shared/Domain/enums/generation-status.enum';
import { GenerationKind } from '@/shared/Domain/enums/generation-kind.enum';
import { LlmProvider } from '@/shared/Domain/enums/llm-provider.enum';
import { PushMode } from '@/shared/Domain/enums/push-mode.enum';

/** One README generation job, written by the LangChain engine (Commit 5). */
@Entity({ name: 'generations' })
export class Generation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne('UserProfile', 'generations')
  @JoinColumn({ name: 'user_id' })
  profile: any;

  /**
   * What was composed: a single repo's README ("Compose a README") or the
   * profile README aggregated from all repos + résumé ("Compose Your Profile").
   */
  @Column({
    type: 'enum',
    enum: GenerationKind,
    default: GenerationKind.REPO_README,
  })
  kind: GenerationKind;

  /** Target repo for `REPO_README`; null for `PROFILE` (spans all repos). */
  @Column({ type: 'uuid', name: 'repo_id', nullable: true })
  repoId: string | null;

  @ManyToOne('Repo', 'generations', { nullable: true })
  @JoinColumn({ name: 'repo_id' })
  repo: any;

  @Column({ type: 'uuid', name: 'resume_id', nullable: true })
  resumeId: string | null;

  @ManyToOne('Resume', { nullable: true })
  @JoinColumn({ name: 'resume_id' })
  resume: any;

  /** The user's steering description ("Compose Your Profile" intent). */
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

  /** The catalog model chosen (nullable — snapshot below survives its deletion). */
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

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;
}
