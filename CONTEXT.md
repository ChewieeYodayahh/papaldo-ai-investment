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
The six-item risk quiz, step 2/3 of Get Started and a card in Tools. The six
topics and their low-to-high risk ordering come from Manulife's *Client
Suitability Assessment*; since 2026-09-26 the **wording is our own plain-language
rewrite** (Carlos's call) with **exactly three choices per question**, each a
short title, a one-line description and an icon. The verbatim transcription it
replaced is in git history. Lives in `src/app/features/tools/quiz/questions.ts`.
Question text stays plain English in every language register.

**Risk profile**
The output of scoring an ISQ submission: a **band** plus a 0–100 **score**. There
are exactly three bands, matching the source questionnaire's result screen:

| Band | Score |
|---|---|
| `Low` | 0–33 |
| `Medium` | 34–66 |
| `High` | 67–100 |

The bands are stored as Low/Medium/High (the source questionnaire's words). On
screen they read as **Conservative / Moderate / Aggressive** — "You are an
Aggressive Investor" — via the copy dictionaries; never store the display word.

A user has exactly **one current risk profile** (`public.risk_profiles`, one row per
user). It is the single source of truth any recommendation feature should read.

**ISQ response**
One completed submission (`public.isq_responses`). The table is **append-only**: a
retake inserts a new row and never rewrites a previous one, so score history stays
available for analysis. Enforced at the database level — the table has no UPDATE
policy and `authenticated` holds no UPDATE grant.

**User profile**
`public.users` — a mirror of `auth.users` holding username, email, contact,
occupation, and (since 2026-09-26) annual and ideal income, each with its own
currency (`USD` or `PHP`, as typed — never converted). It is *not* an auth table:
sessions, passwords and OAuth identities are Supabase Auth's business. A profile
row is created by the `handle_new_user` trigger. Edited on `/profile`.

Two thresholds, deliberately different:
- **Addressable** — has a username. The only thing the middleware enforces.
  Email sign-up sets it; a first Google sign-in is held at `/onboarding/profile`
  until it has one.
- **Setup complete** — username, contact, occupation, annual and ideal income all
  set. Drives the Get Started 1/3 tick. Never a redirect.

**Get Started**
The first-time setup checklist (after Investopedia's), a floating dock on every
signed-in page: 1/3 set up your profile, 2/3 take the quiz, 3/3 take your first
trade (a guided walkthrough; locked until the quiz, because `place_order` needs a
risk profile to buy). Each tick is read from the database, never from clicks.

**Buyable universe**
`public.tradable_assets` — the curated set an order may be placed against:
**50 names** since 2026-09-26 (15 ETF, 17 Technology, 9 Finance, 9 FMCG).
Each stock carries `market_cap_usd`, refreshed weekly by `python/market_caps.py`.

**Sector heatmap**
The Perplexity-style treemap on `/markets`: universe **stocks only** (ETFs
excluded — a fund is a basket of the same names and has no market cap), tile
area ∝ market cap, colour = today's move on a −3%…+3% scale in 1% steps, sector
move **cap-weighted**. Model in `features/markets/heatmap.ts`.

**Index benchmarker**
Tools → Stock Exchange Index Benchmarker: PSEi, NYSE Composite, NASDAQ
Composite and S&P 500 over the last 15 years, monthly
(`public.market_benchmarks`). **Normalised** = close ÷ close in the window's
first month × 100 (every line starts at 100). **YoY** = close ÷ close twelve
months earlier − 1. **CAGR** = (last ÷ 100)^(12 ÷ months) − 1. Shorter ranges
(5Y, 10Y) rebase to 100 in the app. The PSEi line comes from Stooq when the
pipeline can read it, otherwise from **EPHE** (a USD proxy), and says which.

**Returns calculator** (`/tools/returns`, and under the benchmarker)
Replays real monthly closes (Alpaca, split-adjusted; the index table for the
four indices): a lump sum plus a monthly deposit bought at each month's close.
Past returns, never a forecast. **What it buys** turns the ending value into
everyday goods (iPhones, a Porsche, a house and lot, college for N kids) at
reference ₱ prices in `calculators/purchases.ts`.

**Savings goal** (`/tools/savings`, or the "How much should I save" box)
A sinking fund: deposit = FV · r ÷ ((1 + r)^n − 1), with r the rate per
deposit (weekly, every two weeks or monthly). Shows the deposit, total put in
and total growth.

**Export** (`/tools/export`)
MT5-style statement for "a regular person" (summary, holdings) or "into
trading" (trades with realised P&L, equity curve, bars). Built in the
browser as CSV or HTML and downloaded; the server never stores a file, and
Cancel leaves nothing behind.

**Admin** — a user with a row in `public.user_roles` (role `admin`). The first
was seeded 2026-09-29. Admins see the **Developer Dashboard** (`/admin`):
Overview, Integration logs, Notification log, Audit log, Support, Users,
Resources, Blog.

**Integration log** — one row per outside API call (target, route pattern,
status, ms, HTTP status, transaction ID). **Notification log** — in-app and
email notifications with delivery status. **Audit log** — who did what to
which record, written by database triggers (orders, profiles, roles, support,
blog, chat moderation). All three: admin-only reads, 30-day retention, CSV
export.

**Support message** — from `/support`, guests included, rate limited per
email; reference `PPK-XXXXXX`; open or resolved.

**Chat room** — the one community room (`/community`). Signed-in users post
(rate limited); guests read; admins hide a message for everyone.

**Article** — a blog post in Markdown, draft or published. Only published
articles are public. Deleting one is permanent and asks Yes / No first.

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

Enforced in one place, `src/app/core/services/supabase/middleware.ts`, and mirrored
by `src/app/features/auth/api/profile.ts#resolveOnboardingStep`:

```
sign up / sign in
      ↓
no username?         → /onboarding/profile   (first Google sign-in only)
      ↓
                       /dashboard            ← everyone lands here
                           │
                           └─ Get Started dock: 1/3 /onboarding/profile
                                                2/3 /isq
                                                3/3 walkthrough from /markets
```

The only forced step is the username; the questionnaire stopped being a gate on
2026-09-11 and the other profile fields on 2026-09-26. `/isq` and
`/onboarding/profile` stay reachable at any time for retakes and edits.

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

Since the 2026-09-26 rewrite every question has three choices, so only the first
row is in use; the rule stays general so a future longer question still
normalises. Why normalise at all: without it a 6-option question would carry more
than twice the influence of a 3-option one purely because it lists more options.
Equal weighting per question is the intent.

Old `isq_responses` rows (append-only) keep the retired choice ids; the results
page shows those answers as "from an earlier version" rather than failing.

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

## Folder structure

All application code lives under `src/`. The repository root holds configuration
only (`next.config.ts`, `tsconfig.json`, `package.json`, lockfiles).

```
src/
  app/
    <route>/page.tsx         one folder per route; each page.tsx is a thin
                             adapter over a feature page + its metadata
    api/<resource>/route.ts  HTTP handlers, one folder per resource
    core/services/           external-service clients, one area each
      supabase/{client,server,middleware,database.types}.ts
      claude.ts  finnhub.ts
    features/<feature>/       feature modules: api/ components/ hooks/ pages/
                              schema.ts types.ts … A feature may nest another
                              (tools/quiz, tools/calculators, markets/benchmarks,
                              community/blog, userData/{export,preferences,frame});
                              restructured 2026-09-30, see .claude/rules/features.md
    layout.tsx  page.tsx  globals.css
  components/                 cross-feature UI primitives (index.tsx)
  lib/                        framework-agnostic helpers (env.ts)
  middleware.ts               session refresh + onboarding order
```

The import alias `@/*` resolves to `src/*`, so `@/app/features/tools/quiz/scoring`,
`@/components`, `@/lib/env`, `@/app/core/services/supabase/server`.

## Architecture rules

**The UI never calls Supabase or Claude directly.** Components `fetch()` a route
under `src/app/api/*`; those handlers validate and delegate to a server-only module
in `src/app/features/*/api/`. This holds even for Google OAuth: the button POSTs for
a consent URL and navigates to it, rather than importing the Supabase browser client.

`src/app/core/services/supabase/client.ts` exists for future client-side reads and is
intentionally unused. Reaching for it from a form means an API route is missing.

**Features own their logic.** `src/app/` route segments are thin composition;
`src/app/features/*` hold the logic they render. `src/components/`, `src/lib/`, and
`src/app/core/` are shared primitives — none of them may import from
`src/app/features/*`.

**Validation is declared once.** `src/app/features/auth/schema.ts` holds the zod
schemas used by both the client form and the server route, so the two cannot drift.
Client-side validation is a convenience; the server always re-parses.

Validation is deliberately **loose**: `contact` accepts any non-empty string
(mobiles, landlines, foreign numbers, no normalisation) and `username` has a length
floor with no character-set rule.

---

## Data model at a glance

```
auth.users  (Supabase Auth — passwords, sessions, OAuth identities)
    │  1:1, via handle_new_user trigger
    ├── public.users            profile: username, email, contact, occupation,
    │                           annual/ideal income + their currencies
    │
    │  1:N, append-only
    ├── public.isq_responses    every submission ever, with answers + score
    │
    │  1:1, upserted on retake
    └── public.risk_profiles    the CURRENT band + score → what features read

public.user_roles        admin grants (written only by admin_set_role)
public.audit_log         trigger-written; admin read
public.integration_logs  log_integration RPC; admin read
public.notification_log  log_notification RPC + order trigger; admin read
public.support_messages  submit_support_message RPC; admin read/update
public.blog_posts        admin write; published rows public
public.chat_messages     signed-in insert; public read (no user_id for guests)
```

Every table has RLS enabled. User-scoped policies pair `TO authenticated` with an
ownership predicate; admin access goes through `private.is_admin()`. `anon` can read
only published articles, visible chat messages (without `user_id`) and the market
tables, and can write only through the validated support and logging RPCs.
