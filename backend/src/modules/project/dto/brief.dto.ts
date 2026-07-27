import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// --- Allowed values (shared with the compose helper + the frontend form). ---
export const TONES = ['confident', 'warm', 'formal', 'playful'] as const;
export const LENGTHS = ['compact', 'standard', 'detailed'] as const;
export const PROJECT_TYPES = [
  'library',
  'cli',
  'web-app',
  'api',
  'mobile',
  'plugin',
  'demo',
] as const;
export const REPO_AUDIENCES = [
  'end-users',
  'contributors',
  'evaluators',
  'internal',
] as const;
export const REPO_SECTIONS = [
  'badges',
  'features',
  'tech-stack',
  'getting-started',
  'usage',
  'architecture',
  'roadmap',
  'contributing',
  'license',
  'screenshots',
] as const;

/** Structured brief for the project ("Compose a README") flow. All optional. */
export class RepoBrief {
  @IsOptional()
  @IsIn(PROJECT_TYPES)
  projectType?: (typeof PROJECT_TYPES)[number];

  @IsOptional()
  @IsIn(REPO_AUDIENCES)
  audience?: (typeof REPO_AUDIENCES)[number];

  @IsOptional()
  @IsArray()
  @IsIn(REPO_SECTIONS, { each: true })
  sections?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  demoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  docsUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  packageUrl?: string;

  @IsOptional()
  @IsIn(TONES)
  tone?: (typeof TONES)[number];

  @IsOptional()
  @IsIn(LENGTHS)
  length?: (typeof LENGTHS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  emphasis?: string;
}

// --- Render the structured brief into the labeled `intent` text the agent reads. ---

const LABELS: Record<string, string> = {
  confident: 'Confident & concise',
  warm: 'Warm & personable',
  formal: 'Formal',
  playful: 'Playful',
  compact: 'Compact',
  standard: 'Standard',
  detailed: 'Detailed',
  library: 'Library / package',
  cli: 'CLI tool',
  'web-app': 'Web app',
  api: 'API / service',
  mobile: 'Mobile app',
  plugin: 'Framework / plugin',
  demo: 'Learning / demo',
  'end-users': 'End users',
  contributors: 'Contributors',
  evaluators: 'Evaluators / recruiters',
  internal: 'Internal team',
};

function label(v: string): string {
  if (LABELS[v]) return LABELS[v];
  return v.replace(
    /(^|[-\s])(\w)/g,
    (_m: string, sep: string, ch: string) =>
      (sep ? ' ' : '') + ch.toUpperCase(),
  );
}

/** Render the repo brief into the labeled steering text, or null if empty. */
export function composeRepoBrief(brief?: RepoBrief): string | null {
  if (!brief) return null;
  const lines: string[] = [];
  if (brief.projectType)
    lines.push(`Project type: ${label(brief.projectType)}`);
  if (brief.audience) lines.push(`Primary audience: ${label(brief.audience)}`);
  if (brief.tone) lines.push(`Tone: ${label(brief.tone)}`);
  if (brief.length) lines.push(`Length: ${label(brief.length)}`);
  if (brief.sections?.length) {
    lines.push(`Sections to include: ${brief.sections.map(label).join(', ')}`);
  }
  const links = [
    brief.demoUrl && `Live demo: ${brief.demoUrl}`,
    brief.docsUrl && `Documentation: ${brief.docsUrl}`,
    brief.packageUrl && `Package: ${brief.packageUrl}`,
  ].filter(Boolean);
  if (links.length) lines.push(`Links:\n${links.join('\n')}`);
  if (brief.emphasis) lines.push(`Emphasis: ${brief.emphasis}`);
  return lines.length ? lines.join('\n') : null;
}
