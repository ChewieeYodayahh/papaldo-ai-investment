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
features/  auth                 sign-in, session, /profile, users row
           dashboard            home, /portfolio, valuation, performance
           markets              /markets, heatmap (d3-hierarchy), symbol pages
             benchmarks         /markets/benchmarks over public.market_benchmarks
           trading              simulated orders (place_order RPC), order ticket
           advisory             AI market outlook card (/api/advisory/outlook)
           tools                /tools hub
             quiz               ISQ (/isq, /isq/results), scoring, recommendations
             calculators        /tools/{returns,savings,purchasing-power,budget,
                                statements}, deposit rates, "what it buys"
           community            /community chat room, friends, /u/[username]
             blog               /blog, Markdown articles
           support              /support form
           tutorials            Get Started dock, welcome, walkthroughs,
                                profile setup journey (/onboarding/profile)
           userData
             frame              AppShell / PublicShell, header, sidebar, menus, nav
             preferences        Zustand store, <Money>, copy dictionaries
             export             /tools/export — CSV/HTML built in the browser
           admin                /admin Developer Dashboard (admins only, 404 otherwise)
           landing              the public home page
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
`database.md` (RLS, admin, logs) · `quiz.md` (ISQ scoring) ·
`python.md` (pipelines).

## Commands

```
npm run verify        lint + typecheck + unit + Python tests, failures only
npm run verify:full   the same plus next build
npm run dev           Turbopack on http://localhost:3001 (preview: papaldo-dev)
npm run graph         refresh graphify-out/ (AST only, no tokens)
npm run agents:sync   rebuild AGENTS.md after editing CLAUDE.md or .claude/rules
```

Production is **https://papaldo-ka.vercel.app** (2026-09-30; still 404 until
Carlos adds it in Vercel → Domains; the old `papaldo-ai-investment.vercel.app`
stays as an alias). Auth redirects return to the host the request came from,
because the PKCE cookie lives there; `NEXT_PUBLIC_SITE_URL` is only the
fallback. Every public host must be in Supabase's redirect allow list, and
Supabase's Site URL must never be the Vercel-protected
`…-chewieeyodayahhs-projects.vercel.app` team URL. The dev port is pinned by
`--port 3001` in package.json.

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
