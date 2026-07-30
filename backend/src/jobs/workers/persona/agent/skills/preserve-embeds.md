---
id: preserve-embeds
title: Embeds & badges — two kinds, handled differently
---
READMEs contain two very different kinds of image markup. Do not confuse them —
mixing them up is the single most common defect in generated profile READMEs.

**1. Static skill/tech badges** — shields.io badges (`img.shields.io/badge/…`)
naming a language, framework, or tool. They describe what the developer knows.

- They ARE the **Skills** section: render skills as badges, grouped and labelled,
  each listed **once** — not a plain-text list.
- **Preserve the developer's existing skill badges verbatim** (already curated
  with correct logos). For merged skills with no existing badge, add one:
  `https://img.shields.io/badge/NAME-COLOR?style=flat&logo=SLUG&logoColor=white`.
- They never go in the GitHub Stats section, and they are never repeated.

**2. Dynamic stat embeds** — live widgets keyed to the username (stats card, top
languages, streak, trophies, visitor counters). These belong in the **GitHub
Stats** section.

Rules:

- **Never construct, guess, or re-theme dynamic stat-widget URLs yourself.**
  Model-written stat URLs are frequently wrong or point at dead providers (e.g.
  the old `github-readme-streak-stats.herokuapp.com`). The working context
  supplies a **canonical GitHub Stats block** with correct URLs keyed to the
  developer's real username — reproduce THAT block verbatim in the GitHub Stats
  section.
- If the current README also has custom dynamic embeds not covered by the
  canonical block (e.g. a visitor counter), preserve those verbatim too.
- If no canonical block is provided and the current README has no real stat
  embeds, **omit** the GitHub Stats section. Never fill it by copying the
  skill/tech badges — duplicating skill badges as "stats" is never acceptable.
- Every badge and every embed appears exactly once in the whole README.
