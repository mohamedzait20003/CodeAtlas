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
  generation and billing jobs; LangChain / LangGraph over a provider-agnostic LLM factory
  (OpenAI + Google); Cloudflare R2 for résumé storage; region-selected payment gateways
  (Stripe today) behind a port/adapter seam.

## Repository layout

`frontend/` and `backend/` are **independent projects** — each has its own `package.json`,
lockfile, and dependencies. Install and run each separately.

```
codeatlas/
├── frontend/                     # TanStack Start + React 19
└── backend/                      # NestJS + TypeORM (PostgreSQL)
    ├── database/
    │   ├── migrations/           # 4 domain baselines (Identity, Subscription, Persona,
    │   │                         #   Project) + Billing
    │   ├── seeds/                # plans, plan prices, ai-models, admin
    │   └── scripts/
    ├── data-source.ts            # TypeORM CLI data source
    └── src/
        ├── modules/              # feature modules (see below) — each with
        │                         #   controllers/ (one per endpoint + a module base)
        │                         #   services/ entities/ dto/
        │                         #   subscription/ also has adapters/ + factories/
        ├── jobs/                 # background workers (BullMQ) — one process
        │   ├── main.ts           #   boots the mail + persona + project + billing consumers
        │   ├── jobs.module.ts
        │   ├── shared/           #   generation-runner base + agent card-loader + shared
        │   │                     #   agent knowledge (grounding, voice)
        │   └── workers/          #   mail/ · persona/ · project/ · billing/
        ├── host/                 # app bootstrap: app.module.ts, main.ts
        └── shared/               # Domain (enums/interfaces) · Configuration · Common
                                  #   Contracts · Decorators · Factories · Guards
                                  #   Services (encryption, R2 storage)
```

### Modules

| Module | Owns | Endpoints |
|---|---|---|
| `identity` | GitHub OAuth + email/password auth, sessions & tokens | `/auth/*` |
| `subscription` | plans, the AI-model catalog, per-period usage + quota, **billing** | `/ai-models`, `/billing/*` |
| `persona` | **Compose Your Profile** (profile README) | `/compositions/*` |
| `project` | **Compose a README** (one repo) + repo listing | `/repos/*` |
| `resumes` | résumé upload / link (R2 storage) | `/resumes/*` |
| `analytics` | client dashboard summary | `/dashboard` |

Each endpoint is its own single-action controller extending a per-module base controller;
the two generation modules enqueue a job and report status, while the heavy agentic work
runs in `src/jobs`. Plan/quota enforcement is a `@Quota` decorator + guard backed by
`subscription`'s services; usage is reserved on enqueue and refunded on failure.

## Billing & payments

Payments live in the `subscription` module behind a port/adapter seam, so the domain never
talks to a provider SDK directly:

- **`adapters/`** — `PaymentGateway` (the port) + `stripe.gateway.ts`. A gateway's *hosted*
  checkout renders the region's payment methods itself, so the app never lists methods.
- **`factories/`** — `PaymentGatewayFactory` resolves **region → gateway**
  (`US→stripe`, `EG→paymob`, `SA→hyperpay`, else the configured default) and hands back a
  DI singleton; `CancellationPolicyFactory` computes a cancellation outcome.

Adding a provider is one adapter + a region row — no domain changes.

**Lifecycle.** The gateway is the source of truth; our `subscriptions` row is a projection:

| Step | How |
|---|---|
| Subscribe | `POST /billing/checkout` → hosted checkout redirect |
| Sync | `POST /billing/webhook/:gateway` — signature-verified over the **raw body**, recorded once (`payment_events`, unique per event), enqueued, `200` |
| Apply | the billing worker **re-reads the subscription and overwrites the projection** — idempotent and order-independent, so duplicate/late webhooks are harmless |
| Repair | a slow reconciliation sweep (`BILLING_RECONCILE_HOURS`, default 6) re-projects live subscriptions through that same path |

Renewals, `past_due` dunning, and expiry all arrive as webhooks; entitlement follows
automatically because quota reads the projected plan.

**Cancellation** is per billing interval, previewed before it is applied
(`GET /billing/cancellation` → `POST /billing/cancel`):

- **Monthly** — access to the end of the current month, no refund.
- **Yearly** — access to the end of the current month, plus a refund of every whole month
  still left in the paid term at 1/12 of the yearly price (floored, so never over-refunded).

## Subscription tiers

| | Free | Starter | Pro |
|---|---|---|---|
| Repos analyzable | 3 | 25 | ∞ |
| Project READMEs / month | 5 | 75 | 750 |
| Profile composes / month | 1 | 4 | ∞ |
| Model tier | economy | standard | premium |
| Private repos | — | ✓ | ✓ |

Limits live in the `plans` table (and its `features` JSONB), tunable without a redeploy.
Paid tiers are sold **monthly or yearly** — each (plan, gateway, interval) maps to the
gateway's own price id in `plan_prices`. READMEs are currently committed **directly** to
the default branch on all tiers; PR-based push is on the roadmap.

## Getting started

Each app is set up and run independently, and each has its own `.env.example`.
Postgres and Redis must be reachable at the URLs in `backend/.env`.

```bash
# Backend (NestJS API)
cd backend
cp .env.example .env          # DATABASE_URL, REDIS_URL, GitHub OAuth, R2, LLM keys,
                              #   STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*
npm install
npm run migration:run         # applies the domain migrations
npm run seed                  # plans + prices + AI-model catalog + super admin
npm run start:dev             # API
npm run workers               # the background worker process, in its own terminal

# Frontend (TanStack Start), in a separate terminal
cd frontend
cp .env.example .env          # point the API base URL at the backend
npm install
npm run dev
```

### Testing payments locally

Checkout needs real Stripe **Price** ids — set `STRIPE_PRICE_STARTER_MONTH`,
`STRIPE_PRICE_STARTER_YEAR`, `STRIPE_PRICE_PRO_MONTH`, `STRIPE_PRICE_PRO_YEAR` before
seeding (the seed stores placeholders otherwise, and checkout will 400). For webhooks:

```bash
stripe listen --forward-to localhost:4000/api/v1/billing/webhook/stripe
# paste the printed whsec_… into STRIPE_WEBHOOK_SECRET, then restart the API
```

## Admin access

Admin privileges are **role-based**, not a separate table — the `users.role` enum
(`user`, `support`, `super_admin`) governs access. The admin email domain (env-driven,
e.g. `@codeatlasadmin.com`) is reserved for admin accounts: public sign-up with that
domain is rejected by the auth service.
