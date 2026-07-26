import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { Resume } from '@/modules/resumes/entities/resume.entity';
import { ResumeTextService } from './resume-text.service';
import { GithubReaderService } from './github-reader.service';
import type { ProfileContext } from '../context/profile-context';

/**
 * Assembles everything the "Compose Your Profile" agent reads: the user's latest
 * résumé text, their current profile README, and their top project repos.
 * Each source degrades independently — a missing résumé or GitHub link just
 * yields nulls rather than failing the run.
 */
@Injectable()
export class ProfileContextService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Resume) private readonly resumes: Repository<Resume>,
    private readonly resumeText: ResumeTextService,
    private readonly github: GithubReaderService,
  ) {}

  async gather(userId: string): Promise<ProfileContext> {
    const [user, resume] = await Promise.all([
      this.users.findOne({ where: { id: userId } }),
      this.resumes.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const [resumeText, gh] = await Promise.all([
      resume ? this.resumeText.extractText(resume) : Promise.resolve(null),
      this.github.read(userId),
    ]);

    return {
      githubLogin: user?.githubLogin ?? null,
      githubConnected: Boolean(user?.githubOauthTokenEnc),
      resumeText,
      profileReadme: gh?.profileReadme ?? null,
      repos: gh?.repos ?? [],
      statsEmbeds: gh?.statsEmbeds ?? null,
    };
  }
}
