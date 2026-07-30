import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { EncryptionService } from '@/shared/Services/encryption.service';

const GH = 'https://api.github.com';

export interface CommitResult {
  commitSha: string;
  htmlUrl: string;
}

/**
 * Pushes the profile README to the special `<login>/<login>` repo, creating it
 * (public) if absent. Writes straight to the default branch (all tiers direct-push).
 * Uses the user's stored, decrypted OAuth token — server-side only.
 */
@Injectable()
export class PersonaCommitService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly encryption: EncryptionService,
  ) {}

  async commitProfileReadme(
    userId: string,
    content: string,
  ): Promise<CommitResult> {
    const { login, token } = await this.credentials(userId);
    const branch = await this.ensureProfileRepo(login, token);
    const sha = await this.currentReadmeSha(login, branch, token);

    const res = await fetch(
      `${GH}/repos/${login}/${login}/contents/README.md`,
      {
        method: 'PUT',
        headers: this.headers(token),
        body: JSON.stringify({
          message: 'Update profile README via CodeAtlas',
          content: Buffer.from(content, 'utf8').toString('base64'),
          branch,
          ...(sha ? { sha } : {}),
        }),
      },
    );
    if (!res.ok) throw this.fail(res.status, 'commit README');

    const data = (await res.json()) as {
      commit: { sha: string };
      content: { html_url: string } | null;
    };
    return {
      commitSha: data.commit.sha,
      htmlUrl: data.content?.html_url ?? `https://github.com/${login}/${login}`,
    };
  }

  private async credentials(
    userId: string,
  ): Promise<{ login: string; token: string }> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.githubLogin || !user.githubOauthTokenEnc) {
      throw new BadGatewayException('GitHub is not connected.');
    }
    try {
      return {
        login: user.githubLogin,
        token: this.encryption.decrypt(user.githubOauthTokenEnc),
      };
    } catch {
      throw new BadGatewayException('Stored GitHub token is unreadable.');
    }
  }

  /** Default branch of `<login>/<login>`, creating the repo (public) if absent. */
  private async ensureProfileRepo(
    login: string,
    token: string,
  ): Promise<string> {
    const get = await fetch(`${GH}/repos/${login}/${login}`, {
      headers: this.headers(token),
    });
    if (get.ok) {
      const repo = (await get.json()) as { default_branch: string };
      return repo.default_branch;
    }
    if (get.status !== 404) throw this.fail(get.status, 'read profile repo');

    const create = await fetch(`${GH}/user/repos`, {
      method: 'POST',
      headers: this.headers(token),
      body: JSON.stringify({
        name: login,
        description: 'My GitHub profile — composed by CodeAtlas.',
        auto_init: true,
      }),
    });
    if (!create.ok) throw this.fail(create.status, 'create profile repo');
    const repo = (await create.json()) as { default_branch: string };
    return repo.default_branch;
  }

  private async currentReadmeSha(
    login: string,
    branch: string,
    token: string,
  ): Promise<string | undefined> {
    const res = await fetch(
      `${GH}/repos/${login}/${login}/contents/README.md?ref=${encodeURIComponent(branch)}`,
      { headers: this.headers(token) },
    );
    if (res.status === 404) return undefined;
    if (!res.ok) throw this.fail(res.status, 'read README');
    const data = (await res.json()) as { sha?: string };
    return data.sha;
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
