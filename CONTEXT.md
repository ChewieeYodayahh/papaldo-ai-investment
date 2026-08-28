# Papaldo — domain context

Papaldo is an AI investment simulation dashboard for Filipino investors. Users
answer a suitability questionnaire, receive a risk profile, and use it to shape a
**simulated** portfolio. No real money moves through this system and no orders
reach a real broker.

This file is the shared vocabulary. If a term here and the code disagree, one of
them is a bug — fix it rather than inventing a synonym.

---

## Vocabulary

### In use today

**ISQ — Investment Suitability Questionnaire**
The six-item questionnaire every user completes after registering. Its wording is
transcribed verbatim from Manulife's *Client Suitability Assessment*, so it is a
spec, not a draft: do not paraphrase questions or choices. Lives in
`features/isq/questions.ts`.

**Risk profile**
The output of scoring an ISQ submission: a **band** plus a 0–100 **score**. There
are exactly three bands, matching the source questionnaire's result screen:

| Band | Score |
|---|---|
| `Low` | 0–33 |
| `Medium` | 34–66 |
| `High` | 67–100 |

Note this deliberately replaces the "Conservative → Aggressive" wording used in the
original project brief. The source questionnaire uses Low/Medium/High and that won.

A user has exactly **one current risk profile** (`public.risk_profiles`, one row per
user). It is the single source of truth any recommendation feature should read.

**ISQ response**
One completed submission (`public.isq_responses`). The table is **append-only**: a
retake inserts a new row and never rewrites a previous one, so score history stays
available for analysis. Enforced at the database level — the table has no UPDATE
policy and `authenticated` holds no UPDATE grant.

**User profile**
`public.users` — a mirror of `auth.users` holding username, email, contact and
occupation. It is *not* an auth table: sessions, passwords and OAuth identities are
Supabase Auth's business. A profile row is created by the `handle_new_user` trigger.

A profile is **complete** when username, contact and occupation are all non-null.
Email/password sign-up fills all three at once; Google sign-in cannot, so those
users pass through `/onboarding/profile` first.

### Reserved for later phases — do not build yet

**Asset** — an instrument that can be held: a stock, ETF, cryptocurrency or
multi-asset fund. Identified by a symbol and an asset class.

**Holding** — a quantity of one asset inside one portfolio, with a cost basis.

**Portfolio** — a named collection of holdings belonging to one user. A user may
eventually have more than one.

**Simulated order** — a buy or sell recorded against a portfolio at a point-in-time
price. "Simulated" is load-bearing: it never reaches a broker.

**Watchlist** — assets a user tracks without holding.

---

## Onboarding order

Enforced in one place, `shared/supabase/middleware.ts`, and mirrored by
`features/auth/api/profile.ts#resolveOnboardingStep`:

```
sign up / sign in
      ↓
profile incomplete?  → /onboarding/profile
      ↓
no risk profile?     → /isq
      ↓
                       /dashboard
```

The forwarding is **one-directional**. Users are pushed forward past steps they have
not finished, never back from steps they have — which is what keeps `/isq` reachable
for retakes.

---

## Scoring rules

Each question is normalised onto a **0–20** scale, then the six values are averaged
and rescaled to 0–100.

20 is the least common multiple of the questionnaire's gap counts (a 3-choice
question has 2 gaps, a 5-choice one 4, a 6-choice one 5), which is what keeps every
weight a whole number:

| Choices | Weights |
|---|---|
| 3 | 0, 10, 20 |
| 5 | 0, 5, 10, 15, 20 |
| 6 | 0, 4, 8, 12, 16, 20 |

Why normalise at all: without it the 6-option question (Q3) would carry more than
twice the influence of the 3-option ones (Q1, Q4) purely because it lists more
options. Equal weighting per question is the intent.

Choices are declared in **on-screen order, which runs from lowest to highest risk in
every question**, and weights are derived from that position rather than typed by
hand. Reordering a question's choices changes its scoring — that is deliberate, but
know it before you reorder.

The client sends only question and choice ids. Weights are always resolved
server-side from the question bank; a score submitted by the browser is never
trusted.

### Known gap: the source questionnaire's real weights

The screenshots the questions were transcribed from show no per-choice point values
and no score→band cutoff table. The LCM scheme above is a defensible reconstruction,
not Manulife's actual algorithm. If the real weights surface, they are a one-file
change in `questions.ts` plus the thresholds in `scoring.ts`.

---

## Recommended allocation — one known data point

The source result screen showed, for a **Medium** profile:

> Portfolio Balance (Medium Risk): **25% Peso Secure Fund / 75% Peso Global
> Multi-Asset Income Fund**

The equivalent allocations for **Low** and **High** were never captured. Nothing in
this codebase invents them. Allocation display is deliberately deferred to the
dashboard assignment, which will need those two pairs before it can be built.

---

## Architecture rules

**The UI never calls Supabase or Claude directly.** Components `fetch()` a route
under `app/api/*`; those handlers validate and delegate to a server-only module in
`features/*/api/`. This holds even for Google OAuth: the button POSTs for a consent
URL and navigates to it, rather than importing the Supabase browser client.

`shared/supabase/client.ts` exists for future client-side reads and is intentionally
unused. Reaching for it from a form means an API route is missing.

**Features own their logic.** `app/` is thin route composition. `shared/` is
cross-feature primitives only — nothing in `shared/` may import from `features/`.

**Validation is declared once.** `features/auth/schema.ts` holds the zod schemas used
by both the client form and the server route, so the two cannot drift. Client-side
validation is a convenience; the server always re-parses.

Validation is deliberately **loose**: `contact` accepts any non-empty string
(mobiles, landlines, foreign numbers, no normalisation) and `username` has a length
floor with no character-set rule.

---

## Data model at a glance

```
auth.users  (Supabase Auth — passwords, sessions, OAuth identities)
    │  1:1, via handle_new_user trigger
    ├── public.users            profile: username, email, contact, occupation
    │
    │  1:N, append-only
    ├── public.isq_responses    every submission ever, with answers + score
    │
    │  1:1, upserted on retake
    └── public.risk_profiles    the CURRENT band + score → what features read
```

Every table has RLS enabled, every policy pairs `TO authenticated` with an ownership
predicate, and `anon` holds no grant on any of them.
