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
 * One "Compose a README" job — the README for a single target repository. Written
 * by the project worker. (Enum columns reuse the shared `generation_status_enum` /
 * `push_mode_enum` / `llm_provider_enum` types.)
 */
@Entity({ name: 'project_compositions' })
export class ProjectComposition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne('UserProfile')
  @JoinColumn({ name: 'user_id' })
  profile: any;

  /** The target repository (required — a project composition always has one). */
  @Column({ type: 'uuid', name: 'repo_id' })
  repoId: string;

  @ManyToOne('Repo', 'compositions')
  @JoinColumn({ name: 'repo_id' })
  repo: any;

  /** The user's steering brief, rendered to text. */
  @Column({ type: 'text', nullable: true })
  intent: string | null;

  @Column({
    type: 'enum',
    enum: GenerationStatus,
    default: GenerationStatus.QUEUED,
  })
  status: GenerationStatus;

  /** Fine-grained progress within a running job (gathering/drafting/reviewing/…). */
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

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;
}
