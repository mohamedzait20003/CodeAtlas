import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// --- Allowed values (shared with the compose helper + the frontend form). ---
export const SENIORITIES = [
  'student',
  'junior',
  'mid',
  'senior',
  'lead',
] as const;
export const PROFILE_AUDIENCES = [
  'recruiters',
  'hiring-managers',
  'open-source',
  'clients',
] as const;
export const TONES = ['confident', 'warm', 'formal', 'playful'] as const;
export const LENGTHS = ['compact', 'standard', 'detailed'] as const;
export const PROFILE_SECTIONS = [
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'stats',
] as const;

/** Structured brief for the persona ("Compose Your Profile") flow. All optional. */
export class ProfileBrief {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  role?: string;

  @IsOptional()
  @IsIn(SENIORITIES)
  seniority?: (typeof SENIORITIES)[number];

  @IsOptional()
  @IsIn(PROFILE_AUDIENCES)
  audience?: (typeof PROFILE_AUDIENCES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  jobDescription?: string;

  @IsOptional()
  @IsIn(TONES)
  tone?: (typeof TONES)[number];

  @IsOptional()
  @IsIn(LENGTHS)
  length?: (typeof LENGTHS)[number];

  @IsOptional()
  @IsArray()
  @IsIn(PROFILE_SECTIONS, { each: true })
  sections?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  emphasis?: string;
}

// --- Render the structured brief into the labeled `intent` text the agent reads. ---

const LABELS: Record<string, string> = {
  student: 'Student / intern',
  junior: 'Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  lead: 'Lead / principal',
  recruiters: 'Recruiters & ATS',
  'hiring-managers': 'Hiring managers / tech leads',
  'open-source': 'Open-source community',
  clients: 'Clients / freelance',
  confident: 'Confident & concise',
  warm: 'Warm & personable',
  formal: 'Formal',
  playful: 'Playful',
  compact: 'Compact',
  standard: 'Standard',
  detailed: 'Detailed',
};

function label(v: string): string {
  if (LABELS[v]) return LABELS[v];
  return v.replace(
    /(^|[-\s])(\w)/g,
    (_m: string, sep: string, ch: string) =>
      (sep ? ' ' : '') + ch.toUpperCase(),
  );
}

/** Render the profile brief into the labeled steering text, or null if empty. */
export function composeProfileBrief(brief?: ProfileBrief): string | null {
  if (!brief) return null;
  const lines: string[] = [];
  if (brief.role) lines.push(`Target role: ${brief.role}`);
  if (brief.seniority) lines.push(`Seniority: ${label(brief.seniority)}`);
  if (brief.audience) lines.push(`Primary audience: ${label(brief.audience)}`);
  if (brief.tone) lines.push(`Tone: ${label(brief.tone)}`);
  if (brief.length) lines.push(`Length: ${label(brief.length)}`);
  if (brief.sections?.length) {
    lines.push(`Sections to include: ${brief.sections.map(label).join(', ')}`);
  }
  if (brief.emphasis) lines.push(`Emphasis: ${brief.emphasis}`);
  if (brief.jobDescription) {
    lines.push(
      `Target job description (tailor the summary, skills, and keywords to this):\n${brief.jobDescription}`,
    );
  }
  return lines.length ? lines.join('\n') : null;
}
