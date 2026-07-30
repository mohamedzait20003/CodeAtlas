import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface AgentCard {
  meta: Map<string, string[]>;
  body: string;
}

/**
 * Minimal front-matter parser: splits a leading `---` block from the body and
 * reads `key: value`, `key: [a, b]`, and `key:` + `- item` list forms. Kept
 * dependency-free on purpose — the cards only use simple scalar/list keys.
 */
function parse(md: string): AgentCard {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(md);
  if (!match) return { meta: new Map(), body: md.trim() };

  const meta = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    const item = /^\s*-\s*(.+)$/.exec(line);
    if (kv) {
      const value = kv[2].trim();
      let items: string[];
      if (value.startsWith('[')) {
        items = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (value) {
        items = [value];
      } else {
        items = [];
      }
      current = items;
      meta.set(kv[1], items);
    } else if (item && current) {
      current.push(item[1].trim());
    }
  }
  return { meta, body: match[2].trim() };
}

/** Composes an agent card's system prompt from its knowledge + skills. */
export type AgentLoader = (agentFile: string) => string;

/**
 * Builds a loader for one agent's card tree. `agentRoot` is that agent's `agent/`
 * directory; `sharedRoot` is the cross-agent tree ({@link src/jobs/workers/shared/agent}).
 * Knowledge/skill cards resolve from the agent's own tree first, then the shared
 * tree — so cross-cutting cards (`grounding`, `voice`) live in one place without
 * duplication. Each worker runs from source, so callers pass a `__dirname`-based
 * root and the Markdown is read live.
 */
export function makeAgentLoader(
  agentRoot: string,
  sharedRoot: string,
): AgentLoader {
  const read = (root: string, rel: string): AgentCard =>
    parse(readFileSync(join(root, rel), 'utf8'));

  const card = (folder: string, id: string): string => {
    const rel = `${folder}/${id}.md`;
    if (existsSync(join(agentRoot, rel))) return read(agentRoot, rel).body;
    if (existsSync(join(sharedRoot, rel))) return read(sharedRoot, rel).body;
    throw new Error(`Agent card not found: ${rel}`);
  };

  const assemble: AgentLoader = (agentFile) => {
    const { meta, body } = read(agentRoot, `agents/${agentFile}`);
    const sections = [body];

    const knowledge = (meta.get('knowledge') ?? []).map((id) =>
      card('knowledge', id),
    );
    if (knowledge.length) sections.push('# Operating principles', ...knowledge);

    const skills = (meta.get('skills') ?? []).map((id) => card('skills', id));
    if (skills.length) sections.push('# Skills', ...skills);

    return sections.join('\n\n');
  };

  return assemble;
}
