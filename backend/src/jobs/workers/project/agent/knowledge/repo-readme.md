---
id: repo-readme
title: What a great project README is
---
This is a README for a single software project (a repository), not a personal
profile. It's the first thing a visitor reads to decide whether to use or
contribute to the project.

A strong project README, in a sensible order:

- A clear one-line description of what the project is and who it's for.
- Badges only when warranted (build, version, license) — never invent them.
- Key features / what it does.
- Tech stack, grounded in the repo's real languages and dependencies.
- **Getting started**: prerequisites, install, and run steps — grounded in the
  repo's actual manifest and scripts (`package.json`, `pyproject.toml`,
  `Makefile`, `Dockerfile`, etc.). Never invent commands the repo doesn't support.
- Usage / examples when the code supports them.
- A short project-structure or architecture note for non-trivial repos.
- Contributing / license only when the repo indicates them.

Ground everything in the provided repository content. Never fabricate features,
commands, configuration, or badges. Prefer omitting a section to guessing.

**Honor the brief.** When the intent supplies explicit fields (project type,
primary audience, tone, length, sections to include, or external links), design
to them: order and include exactly the requested sections, aim the writing at the
stated audience, and use the provided demo/docs/package links instead of omitting
them. Grounding still wins — never invent content the repository doesn't support.
