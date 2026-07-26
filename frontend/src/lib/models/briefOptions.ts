/** Option lists for the Compose brief forms. Values mirror the backend brief DTO. */
export type Option = { value: string; label: string };

export const SENIORITIES: Option[] = [
  { value: "student", label: "Student / intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / principal" },
];

export const PROFILE_AUDIENCES: Option[] = [
  { value: "recruiters", label: "Recruiters & ATS" },
  { value: "hiring-managers", label: "Hiring managers / tech leads" },
  { value: "open-source", label: "Open-source community" },
  { value: "clients", label: "Clients / freelance" },
];

export const TONES: Option[] = [
  { value: "confident", label: "Confident & concise" },
  { value: "warm", label: "Warm & personable" },
  { value: "formal", label: "Formal" },
  { value: "playful", label: "Playful" },
];

export const LENGTHS: Option[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
];

export const PROFILE_SECTIONS: Option[] = [
  { value: "summary", label: "Summary" },
  { value: "skills", label: "Skills" },
  { value: "experience", label: "Experience" },
  { value: "projects", label: "Projects" },
  { value: "education", label: "Education" },
  { value: "certifications", label: "Certifications" },
  { value: "stats", label: "GitHub stats" },
];

export const PROJECT_TYPES: Option[] = [
  { value: "library", label: "Library / package" },
  { value: "cli", label: "CLI tool" },
  { value: "web-app", label: "Web app" },
  { value: "api", label: "API / service" },
  { value: "mobile", label: "Mobile app" },
  { value: "plugin", label: "Framework / plugin" },
  { value: "demo", label: "Learning / demo" },
];

export const REPO_AUDIENCES: Option[] = [
  { value: "end-users", label: "End users" },
  { value: "contributors", label: "Contributors" },
  { value: "evaluators", label: "Evaluators / recruiters" },
  { value: "internal", label: "Internal team" },
];

export const REPO_SECTIONS: Option[] = [
  { value: "badges", label: "Badges" },
  { value: "features", label: "Features" },
  { value: "tech-stack", label: "Tech stack" },
  { value: "getting-started", label: "Getting started" },
  { value: "usage", label: "Usage / examples" },
  { value: "architecture", label: "Architecture" },
  { value: "roadmap", label: "Roadmap" },
  { value: "contributing", label: "Contributing" },
  { value: "license", label: "License" },
  { value: "screenshots", label: "Screenshots" },
];
