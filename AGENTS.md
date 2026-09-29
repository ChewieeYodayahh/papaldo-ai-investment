# Papaldo

AI investment simulation dashboard for Filipino investors. Sign up → 6-item
Investment Suitability Questionnaire → risk band → simulated portfolio.
Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui (Base UI) + Supabase; the AI
service in `core/services/claude.ts` currently calls Gemini.

## Layout

`@/*` → `./src/*`. Routes are thin `src/app/<route>/page.tsx` adapters; the
logic lives in `src/app/features/<name>/{api,components,pages}` (pages are
`*.page.tsx`). Route handlers in `src/app/api/*` delegate to `features/*/api`.

```
features/  auth         sign-in, session, /profile, users row
           onboarding   ISQ (/isq, /isq/results), setup journey
           dashboard    home, /portfolio, valuation, performance
           markets      /markets, heatmap (d3-hierarchy), symbol pages
           trading      simulated orders (place_order RPC), order ticket
           advisory     AI market outlook card (/api/advisory/outlook)
           benchmarks   /tools/benchmarks over public.market_benchmarks
           calculators  /tools/returns, /tools/savings, "what it buys"
           export       /tools/export — CSV/HTML built in the browser
           tools        /tools cards
           blog · community · support    public pages (/blog, /community, /support)
           admin        /admin Developer Dashboard (admins only, 404 otherwise)
           shell        AppShell / PublicShell, header, sidebar, Get Started
           preferences  Zustand store, <Money>, copy dictionaries
           landing      the public home page
core/services/  alpaca · finnhub · exchange-rate · claude (Gemini) ·
                integration-log · supabase/{client,server,session,database.types}
src/components/ui/  shadcn primitives · skeleton-blocks.tsx for loading.tsx
supabase/migrations/ · python/ (weekly market-data pipelines)
```

## Always

- UI never calls Supabase or the AI service directly: component → `src/app/api/*`
  → `features/*/api`.
- Tailwind tokens only, never a hardcoded color; `<Money usd>` for money;
  never hand-roll a primitive from `src/components/ui/`; every route gets a
  `loading.tsx`.
- RLS on every user-scoped table, verified with role-switched queries. No
  service-role key in the Next app and never in a `NEXT_PUBLIC_` variable.
- Never script past a site's bot or browser check.

Path-scoped detail loads on its own when you touch matching files:
`.claude/rules/ui.md` (tsx, css) · `features.md` (import directions, routes) ·
`database.md` (RLS, admin, logs) · `onboarding.md` (ISQ scoring) ·
`python.md` (pipelines).

## Commands

```
npm run verify        lint + typecheck + unit + Python tests, failures only
npm run verify:full   the same plus next build
npm run dev           Turbopack on http://localhost:3001 (preview: papaldo-dev)
npm run graph         refresh graphify-out/ (AST only, no tokens)
npm run agents:sync   rebuild AGENTS.md after editing CLAUDE.md or .claude/rules
```

`NEXT_PUBLIC_SITE_URL` only builds OAuth/email redirect URLs; the dev port is
pinned by `--port 3001` in package.json. Keep the two in step.

## Working economically

- Questions that need more than ~3 reads → the `explorer` agent (Haiku)
  returns `path:line` answers instead of file dumps.
- After edits → `/verify` (forked `verifier`); schema or policy changes →
  `db-auditor`; page changes → `ui-checker` (text verdict, no screenshots).
- New feature → `/feature <brief>`; end of session → `/wrap`.
- Orient from `graphify-out/GRAPH_REPORT.md` and `graphify explain "<Symbol>"`
  before reading widely. Never read `.env*`, `graphify-out/graph.json` or
  `package-lock.json`.

## Deeper context

`CONTEXT.md` domain vocabulary and decisions · `PROGRESS.md` phase log and what
is blocked on Carlos · `EXTERNAL_SERVICES.md` every API and MCP server.

## Path-scoped rules

### Database, access and logging rules

_Applies when working in: `supabase/**`, `src/app/core/services/**`, `src/app/features/*/api/**`, `src/app/api/**`, `src/app/admin/**`, `src/app/features/admin/**`_

- RLS on every user-scoped table. Verify with role-switched queries inside a
  rolled-back transaction (the `db-auditor` agent does this); don't assume a
  policy works because it exists.
- Admin access: the role lives in `public.user_roles` (never a column on
  `users` — owners can update every column there) and is checked in the
  database by `private.is_admin()` on every admin read and write. The app's
  `requireAdmin()` only decides what renders (404 for everyone else) and runs
  in `AdminShell` *and* in every admin page, because a layout is not re-run on
  client navigation. The Next app has no service-role key; admin work runs
  with the admin's own session.
- Logs: the audit log is written only by database triggers. Every outside
  call (Alpaca, Finnhub, exchange rate, AI) goes through `withIntegrationLog`
  / `logIntegration` in `core/services/integration-log.ts`, which logs a route
  *pattern* (`routePattern`), never a URL, query string or key. Notifications
  go through the `log_notification` RPC. Logs self-trim to 30 days.
- Market data the app does not fetch live (index history, market caps) is
  written by `python/` pipelines with the service-role key and only *read* by
  the app. Those tables grant `anon`/`authenticated` SELECT only. Never add a
  client write path to them.
- After a migration, regenerate `core/services/supabase/database.types.ts`
  and keep its hand-kept `market_outlooks` block.

### Feature and route rules

_Applies when working in: `src/app/features/**`, `src/app/api/**`, `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/middleware.ts`_

- Each `src/app/**/page.tsx` is a thin adapter: import a feature page, add
  metadata. No logic, no data fetching. App routes also carry `layout.tsx`
  (renders AppShell, which falls back to PublicShell for guests) and
  `loading.tsx`. Never put a file named `page.tsx` under
  `src/app/features/` — it would become a `/features/...` route.
- Route handlers in `src/app/api/*` validate and delegate to the matching
  `features/*/api` module; no logic inline in the handler.
- Cross-feature imports run one way only: `onboarding` and `dashboard` may
  import `auth`; `auth` imports neither. `shell` wraps pages and may import
  `auth`, `trading`, `preferences`, `onboarding` (read-only: the risk profile
  behind the Get Started checklist) and `SymbolMark` from `markets`; pages
  import `shell`, never the reverse, so `onboarding` must never import
  `shell`. `tools` may import `auth`, `onboarding`, `benchmarks` and `shell`.
  `benchmarks` may import `calculators` and `markets`; `calculators` and
  `blog` import no feature but `preferences`; `community` imports `auth`;
  `support` imports `shell`; `export` reads `auth`, `dashboard`, `markets`,
  `onboarding` and `trading`; `admin` may import `auth`, `blog`, `export`
  (formats only), `shell` and `preferences`, and nothing imports `admin`.
  `preferences` imports no feature.
- Ownership: `auth` owns credentials, the session, the `users` row and the
  `OnboardingStep` type. `onboarding` owns the two screens a new account
  walks through and everything only they use.
- Only a username is required before the app opens (middleware). Contact,
  occupation and income are the optional setup journey; the quiz is never a
  gate. After login, everyone lands on `/dashboard`.

### ISQ rules

_Applies when working in: `src/app/features/onboarding/**`_

- ISQ scoring is a reconstruction, not from source data. It is isolated to
  `features/onboarding/questions.ts` and `scoring.ts` for that reason —
  change both together and update the tests. Since 2026-09-26 the wording is
  our own plain-language rewrite, exactly three choices per question
  (0/10/20).

### Pipeline rules

_Applies when working in: `python/**`, `.github/workflows/**`_

- `python/` pipelines (Python 3.12, `python/.venv`) write market data with the
  service-role key; `.github/workflows/market-data.yml` runs them weekly.
- Never script past a site's bot or browser check (Stooq's included). A
  pipeline that meets one logs it and falls back to the next source.
- Commands:
  `python/.venv/Scripts/python -m unittest discover -s python` ·
  `python/.venv/Scripts/python python/benchmarks.py --dry-run`.
  Create the venv with `uv venv python/.venv --python 3.12` and
  `uv pip install --python python/.venv/Scripts/python.exe -r python/requirements.txt`.

### UI rules

_Applies when working in: `src/**/*.tsx`, `src/**/*.jsx`, `src/app/globals.css`_

- Colors: Tailwind tokens only — `bg-primary`, `text-muted-foreground`,
  `border-border`. Never `bg-blue-500` or a hardcoded hex. Palette is OKLCH,
  defined at `:root` in `src/app/globals.css`.
- Light and dark themes both ship (`next-themes`, `attribute="class"`,
  light/dark/system); the `.dark` palette is in `globals.css`. Phase 1 had
  dark mode off because components used a fixed light palette — that is why
  the token rule is load-bearing: a hardcoded color renders dark-on-dark.
- Gains and losses use `text-gain` / `text-loss`. Palettes live in
  `globals.css` under `[data-palette=...]`; add a new token to every palette.
  Heatmap colours are the `--heat-*` tokens.
- Never hand-roll a primitive that exists in `src/components/ui/` (shadcn
  base-nova, built on Base UI: triggers take `render={<Button />}`, not
  `asChild`).
- Money on screen goes through `<Money usd={...} />`, which converts to PHP at
  render time. Never store or compute a converted figure server-side. One
  exception: self-reported incomes (`users.annual_income` / `ideal_income`)
  are shown in the currency they were entered in (`auth/income.ts`) and are
  never converted.
- Copy goes through `useCopy()` keys in `features/preferences/copy.ts`; add
  the English key, the other dictionaries fall back to it.
- Chart lines get a dot on every data point: `pointDot()` from
  `src/lib/chart-dots.ts`.
- Every new route gets a `loading.tsx` skeleton built from
  `src/components/skeleton-blocks.tsx`, laid out like the page it replaces.

## A note for non-Claude agents reading this file

This file is generated by `npm run agents:sync` from `CLAUDE.md` and
`.claude/rules/*.md` — edit those, not this. Claude Code loads the rules only
when it touches matching paths; they are inlined here because other agents do
not read `.claude/`. The AI service lives in `core/services/claude.ts`
(it currently calls Gemini); whatever agent you are, describe the codebase as
it actually is — this file and `CLAUDE.md` always say the same thing about the
code, even where their framing differs.
