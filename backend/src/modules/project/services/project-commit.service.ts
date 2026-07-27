import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { EncryptionService } from '@/modules/identity/services/encryption.service';

const GH = 'https://api.github.com';

export interface CommitResult {
  commitSha: string;
  htmlUrl: string;
}

/**
 * Pushes a README straight to a target repo's default branch (direct commit).
 * Uses the user's stored, decrypted OAuth token — server-side only.
 */
@Injectable()
export class ProjectCommitService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly encryption: EncryptionService,
  ) {}

  async commitRepoReadme(
    userId: string,
    fullName: string,
    branch: string,
    content: string,
  ): Promise<CommitResult> {
    const token = await this.token(userId);
    const sha = await this.readmeShaFor(fullName, branch, token);

    const res = await fetch(`${GH}/repos/${fullName}/contents/README.md`, {
      method: 'PUT',
      headers: this.headers(token),
      body: JSON.stringify({
        message: 'Update README via CodeAtlas',
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!res.ok) throw this.fail(res.status, 'commit README');

    const data = (await res.json()) as {
      commit: { sha: string };
      content: { html_url: string } | null;
    };
    return {
      commitSha: data.commit.sha,
      htmlUrl: data.content?.html_url ?? `https://github.com/${fullName}`,
    };
  }

  /** SHA of a repo's existing README on `branch` (undefined when there is none). */
  private async readmeShaFor(
    fullName: string,
    branch: string,
    token: string,
  ): Promise<string | undefined> {
    const res = await fetch(
      `${GH}/repos/${fullName}/contents/README.md?ref=${encodeURIComponent(branch)}`,
      { headers: this.headers(token) },
    );
    if (res.status === 404) return undefined;
    if (!res.ok) throw this.fail(res.status, 'read README');
    const data = (await res.json()) as { sha?: string };
    return data.sha;
  }

  private async token(userId: string): Promise<string> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.githubOauthTokenEnc) {
      throw new BadGatewayException('GitHub is not connected.');
    }
    try {
      return this.encryption.decrypt(user.githubOauthTokenEnc);
    } catch {
      throw new BadGatewayException('Stored GitHub token is unreadable.');
    }
  }

  private headers(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
  }

  private fail(status: number, action: string): BadGatewayException {
    if (status === 401 || status === 403) {
      return new BadGatewayException(
        'GitHub rejected the write — your connection may lack repo permissions. Reconnect GitHub and try again.',
      );
    }
    return new BadGatewayException(
      `GitHub request failed (${action}, ${status}).`,
    );
  }
}
