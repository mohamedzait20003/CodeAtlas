import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { User } from '@/modules/identity/entities/user.entity';
import { EncryptionService } from '@/modules/identity/services/encryption.service';
import { paginate, type PagedResult } from '@/shared/Common/paged-result';
import type { RepoItem } from '@/modules/project/dto/repo.dto';

const MAX_PAGES = 5;
const PER_PAGE = 100;
const REPOS_TTL_MS = 120_000;

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  html_url: string;
}

@Injectable()
export class GithubReposService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly encryption: EncryptionService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async list(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PagedResult<RepoItem>> {
    const all = await this.getAllRepos(userId);
    return paginate(all, page, pageSize);
  }

  /** One of the user's own repos by GitHub id (from the cached list), or null. */
  async findById(userId: string, githubId: string): Promise<RepoItem | null> {
    const all = await this.getAllRepos(userId);
    return all.find((r) => r.Id === githubId) ?? null;
  }

  /** Full, profile-repo-excluded repo list for the user (cached). */
  private async getAllRepos(userId: string): Promise<RepoItem[]> {
    const key = `repos:${userId}`;

    const cached = await this.cache.get<RepoItem[]>(key);
    if (cached) return cached;

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.githubOauthTokenEnc) return []; // GitHub not linked

    let token: string;
    try {
      token = this.encryption.decrypt(user.githubOauthTokenEnc);
    } catch {
      return []; // tampered/unreadable token — treat as not linked
    }

    const profileRepo = user.githubLogin?.toLowerCase() ?? null;

    const items = (await this.fetchAllRepos(token))
      .filter((r) => r.name.toLowerCase() !== profileRepo)
      .map((r): RepoItem => ({
        Id: String(r.id),
        Name: r.name,
        FullName: r.full_name,
        Private: r.private,
        DefaultBranch: r.default_branch,
        Language: r.language,
        Stars: r.stargazers_count,
        UpdatedAt: r.updated_at,
        HtmlUrl: r.html_url,
      }));

    await this.cache.set(key, items, REPOS_TTL_MS);
    return items;
  }

  private async fetchAllRepos(token: string): Promise<GithubRepo[]> {
    const all: GithubRepo[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `https://api.github.com/user/repos?per_page=${PER_PAGE}&page=${page}&sort=updated&affiliation=owner`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );

      if (!res.ok) {
        throw new BadGatewayException(
          'Could not load repositories from GitHub.',
        );
      }

      const batch = (await res.json()) as GithubRepo[];
      all.push(...batch);
      if (batch.length < PER_PAGE) break; // last page
    }

    return all;
  }
}
