import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/modules/identity/entities/user.entity';
import { EncryptionService } from '@/shared/Services/encryption.service';
import type { RepoReadmeContext } from '../context/project-context';

const GH = 'https://api.github.com';
const README_MAX = 6_000;
const MANIFEST_MAX = 4_000;

/** Manifests to surface (first match in the top-level tree wins). */
const MANIFESTS = [
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'composer.json',
  'Gemfile',
  'Dockerfile',
  'Makefile',
];

type Headers = Record<string, string>;

/**
 * Reads one target repository's content for the repo-README agent — description,
 * languages, top-level file tree, primary manifest, and current README. Uses the
 * user's stored, decrypted OAuth token; server-side only.
 */
@Injectable()
export class ProjectContentService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly encryption: EncryptionService,
  ) {}

  async read(
    userId: string,
    fullName: string,
    defaultBranch: string,
  ): Promise<RepoReadmeContext> {
    const headers = this.headers(await this.token(userId));

    const [meta, languages, tree, readme] = await Promise.all([
      this.json<{ description: string | null }>(
        `${GH}/repos/${fullName}`,
        headers,
      ),
      this.json<Record<string, number>>(
        `${GH}/repos/${fullName}/languages`,
        headers,
      ),
      this.topLevel(fullName, defaultBranch, headers),
      this.raw(`${GH}/repos/${fullName}/readme`, headers, README_MAX),
    ]);

    const manifestName = MANIFESTS.find((m) => tree.includes(m));
    const manifest = manifestName
      ? await this.raw(
          `${GH}/repos/${fullName}/contents/${manifestName}`,
          headers,
          MANIFEST_MAX,
        )
      : null;

    return {
      fullName,
      description: meta?.description ?? null,
      languages: languages ? Object.keys(languages) : [],
      fileTree: tree,
      manifest,
      readme,
    };
  }

  private async token(userId: string): Promise<string> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user?.githubOauthTokenEnc) throw new Error('GitHub is not connected.');
    return this.encryption.decrypt(user.githubOauthTokenEnc);
  }

  private async json<T>(url: string, headers: Headers): Promise<T | null> {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return (await res.json()) as T;
  }

  /** Top-level entries (dirs suffixed with `/`) of the repo's default branch. */
  private async topLevel(
    fullName: string,
    branch: string,
    headers: Headers,
  ): Promise<string[]> {
    const data = await this.json<{ tree: { path: string; type: string }[] }>(
      `${GH}/repos/${fullName}/git/trees/${encodeURIComponent(branch)}`,
      headers,
    );
    if (!data) return [];
    return data.tree.map((t) => (t.type === 'tree' ? `${t.path}/` : t.path));
  }

  private async raw(
    url: string,
    headers: Headers,
    max: number,
  ): Promise<string | null> {
    const res = await fetch(url, {
      headers: { ...headers, Accept: 'application/vnd.github.raw' },
    });
    if (!res.ok) return null;
    return (await res.text()).slice(0, max);
  }

  private headers(token: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }
}
