import { join } from 'path';

import { makeAgentLoader } from '@/jobs/shared/agent/card-loader';
import type { RepoReadmeContext } from './project-context';

/** This agent's card tree (…/repo/agent) + the shared cross-agent tree. */
const AGENT_DIR = join(__dirname, '..', 'agent');
const SHARED_DIR = join(__dirname, '..', '..', '..', 'shared', 'agent');
const assemble = makeAgentLoader(AGENT_DIR, SHARED_DIR);

/** Repo ("Compose a README") role prompts, assembled once at worker startup. */
export const REPO_WRITER_PROMPT = assemble('repo-writer.agent.md');
export const REPO_REVIEWER_PROMPT = assemble('repo-reviewer.agent.md');

// --- Human-turn builders: pack one repository's content into the agent input. ---

export function repoWriterInput(
  context: RepoReadmeContext,
  intent: string | null,
  critique: string,
): string {
  const parts = [intentLine(intent)];
  if (critique && !/\bAPPROVED\b/i.test(critique)) {
    parts.push(`# Revision feedback\n${critique}`);
  }
  parts.push(repoContextBlock(context));
  return parts.filter(Boolean).join('\n\n');
}

export function repoReviewerInput(
  context: RepoReadmeContext,
  draft: string,
): string {
  return [repoContextBlock(context), `# Draft README\n${draft}`].join('\n\n');
}

function intentLine(intent: string | null): string {
  return intent ? `User intent: ${intent}` : '';
}

function repoContextBlock(ctx: RepoReadmeContext): string {
  const parts = [
    `# Repository: ${ctx.fullName}`,
    `Description: ${ctx.description ?? '(none)'}`,
    `Languages: ${ctx.languages.length ? ctx.languages.join(', ') : '(unknown)'}`,
    `\n## Top-level files\n${
      ctx.fileTree.length ? ctx.fileTree.join('\n') : '(none)'
    }`,
  ];
  if (ctx.manifest) parts.push(`\n## Primary manifest\n${ctx.manifest}`);
  parts.push(
    ctx.readme
      ? `\n## Current README\n${ctx.readme}`
      : '\n## Current README\n(none yet)',
  );
  return parts.join('\n');
}
