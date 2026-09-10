# Papaldo

AI investment **simulation** dashboard for Filipino investors. Users register,
complete an Investment Suitability Questionnaire (ISQ), receive a Low / Medium /
High risk profile, and use it to shape a simulated portfolio. No real money moves
through the system and no orders reach a broker.

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase (Auth + Postgres with
RLS) · Zod · Vitest.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run dev                   # http://localhost:3000
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required.
`NEXT_PUBLIC_SITE_URL` is required outside development (used to build the OAuth
redirect). See `.env.example`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (`next/core-web-vitals` + `next/typescript`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (`src/**/*.test.ts`) |

## Structure

```
src/
  app/
    <route>/page.tsx         one folder per route; a thin adapter over a
                             feature page, nothing more
    api/<resource>/route.ts  HTTP handlers; validate + delegate to features/*/api
    core/services/           external-service clients (supabase/, claude.ts)
    features/<feature>/       feature modules: api/ components/ hooks/ pages/ …
    layout.tsx  page.tsx  globals.css
  components/                 cross-feature UI primitives
  lib/                        framework-agnostic helpers (env.ts)
  middleware.ts               session refresh + one-directional onboarding order
supabase/migrations/          schema, mirrored from the Supabase project
```

`@/*` resolves to `src/*`. The UI never calls Supabase or Claude directly — it
`fetch()`es an `app/api/*` route. See `CONTEXT.md` for domain vocabulary and the
full architecture rules, and `PROGRESS.md` for the build log.
