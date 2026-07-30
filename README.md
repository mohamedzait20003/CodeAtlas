# CodeAtlas

Turn your code into documentation — starting with READMEs, informed by your résumé.

CodeAtlas connects to a user's GitHub account and (optionally) a résumé, then uses an
LLM agent to compose two kinds of README:

- **Profile README** — a GitHub profile README (`<login>/<login>`) written from the
  résumé plus every repository.
- **Project README** — a grounded README for a single repository, from its real code,
  manifest, and existing README.

Each run is driven by a structured **brief** (target role/audience, sections, tone,
length, …), streamed through a review loop, and — after the user edits it — committed
straight to GitHub. The dashboard is framed as a **code-intelligence hub**: profile and
project READMEs are the live capabilities, with more (explain architecture, document
code, detect bugs, find duplicates, suggest refactors, estimate tech debt) on the roadmap.

## Stack

- **Frontend** — TanStack Start + React 19, shadcn/ui, Tailwind v4, TanStack Query.
- **Backend** — NestJS + TypeORM (PostgreSQL), a modular monolith; BullMQ (Redis) for the
  generation jobs; LangChain / LangGraph over a provider-agnostic LLM factory
  (OpenAI + Google); Cloudflare R2 for résumé storage.

## Repository layout

`frontend/` and `backend/` are **independent projects** — each has its own `package.json`,
lockfile, and dependencies. Install and run each separately.

```
codeatlas/
├── frontend/                     # TanStack Start + React 19
└── backend/                      # NestJS + TypeORM (PostgreSQL)
    ├── database/
    │   ├── migrations/           # 4 domain baselines: Identity, Subscription, Persona, Project
    │   ├── seeds/                # plans, ai-models, admin
    │   └── scripts/
    ├── data-source.ts            # TypeORM CLI data source
    └── src/
        ├── modules/              # feature modules (see below) — each with
        │                         #   controllers/ (one per endpoint + a module base)
        │                         #   services/ entities/ dto/
        ├── jobs/                 # background workers (BullMQ) — one process
        │   ├── main.ts           #   boots the mail + persona + project consumers
        │   ├── jobs.module.ts
        │   ├── shared/           #   generation-runner base + agent card-loader + shared
        │   │                     #   agent knowledge (grounding, voice)
        │   └── workers/          #   mail/ · persona/ · project/  (each its own queue + agent)
        ├── host/                 # app bootstrap: app.module.ts, main.ts
        └── shared/               # Domain (enums/interfaces) · Configuration · Common
                                  #   Contracts · Decorators · Factories · Guards
                                  #   Services (encryption, R2 storage)
```

### Modules

| Module | Owns | Endpoints |
|---|---|---|
| `identity` | GitHub OAuth + email/password auth, sessions & tokens | `/auth/*` |
| `subscription` | plans, the AI-model catalog, per-period usage + quota | `/ai-models` |
| `persona` | **Compose Your Profile** (profile README) | `/compositions/*` |
| `project` | **Compose a README** (one repo) + repo listing | `/repos/*` |
| `resumes` | résumé upload / link (R2 storage) | `/resumes/*` |
| `analytics` | client dashboard summary | `/dashboard` |

Each endpoint is its own single-action controller extending a per-module base controller;
the two generation modules enqueue a job and report status, while the heavy agentic work
runs in `src/jobs`. Plan/quota enforcement is a `@Quota` decorator + guard backed by
`subscription`'s services; usage is reserved on enqueue and refunded on failure.

## Subscription tiers

| | Free | Starter | Pro |
|---|---|---|---|
| Repos analyzable | 3 | 25 | ∞ |
| Project READMEs / month | 5 | 75 | 750 |
| Profile composes / month | 1 | 4 | ∞ |
| Model tier | economy | standard | premium |
| Private repos | — | ✓ | ✓ |

Limits live in the `plans` table (and its `features` JSONB), tunable without a redeploy.
READMEs are currently committed **directly** to the default branch on all tiers; PR-based
push is on the roadmap.

## Getting started

Each app is set up and run independently, and each has its own `.env.example`.
Postgres and Redis must be reachable at the URLs in `backend/.env`.

```bash
# Backend (NestJS API)
cd backend
cp .env.example .env          # DATABASE_URL, REDIS_URL, GitHub OAuth, R2, LLM keys, …
npm install
npm run migration:run         # applies the 4 domain migrations
npm run seed                  # plans + AI-model catalog + super admin
npm run start:dev             # API
npm run workers               # the background worker process, in its own terminal

# Frontend (TanStack Start), in a separate terminal
cd frontend
cp .env.example .env          # point the API base URL at the backend
npm install
npm run dev
```

## Admin access

Admin privileges are **role-based**, not a separate table — the `users.role` enum
(`user`, `support`, `super_admin`) governs access. The admin email domain (env-driven,
e.g. `@codeatlasadmin.com`) is reserved for admin accounts: public sign-up with that
domain is rejected by the auth service.
