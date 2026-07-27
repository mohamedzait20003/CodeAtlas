import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** A GitHub repository synced from the user's account (Commit 4). */
@Index(['userId', 'githubRepoId'], { unique: true })
@Entity({ name: 'repositories' })
export class Repo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne('UserProfile', 'repos')
  @JoinColumn({ name: 'user_id' })
  profile: any;

  @Column({ type: 'bigint', name: 'github_repo_id' })
  githubRepoId: string;

  @Column({ type: 'text', name: 'full_name' })
  fullName: string;

  @Column({ type: 'text', name: 'default_branch', default: 'main' })
  defaultBranch: string;

  @Column({ type: 'boolean', name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({ type: 'timestamptz', name: 'last_analyzed_at', nullable: true })
  lastAnalyzedAt: Date | null;

  @OneToMany('ProjectComposition', 'repo')
  compositions: any[];
}
