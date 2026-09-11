# Papaldo

AI investment simulation dashboard for Filipino investors. Sign up → 6-item
Investment Suitability Questionnaire → risk band → simulated portfolio.

Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui + Supabase + Claude API.

## Layout

`@/*` → `./src/*`

```
src/app/                    one folder per route — each page.tsx is a thin
  login/  sign-up/          adapter that imports a feature page and adds
  dashboard/  isq/          metadata. No logic, no data fetching.
  markets/  onboarding/profile/
  api/                      route handlers — delegate to features/*/api
  features/<name>/          owns api/ components/ hooks/ pages/ + schema.ts,
    auth                    types.ts. pages/<name>.page.tsx exports a named
    onboarding              component; only src/app/**/page.tsx is a route.
    dashboard
    markets
    landing                 sections/ + landing.page.tsx
  core/services/            cross-feature only
    claude.ts  finnhub.ts
    supabase/               client, server, middleware, database.types
src/components/ui/          shadcn primitives (base-nova / mist)
src/components/*.jsx        React Bits components
src/lib/utils.ts            cn()
supabase/migrations/
```

Never put a file named `page.tsx` under `src/app/features/` — the App Router
would publish it as a `/features/...` route. Feature pages are `*.page.tsx`.

## Rules

- UI never calls Supabase or Claude directly. Route through `src/app/api/*`,
  with the logic in the matching `features/*/api` module, not inline in the
  route handler.
- Colors: Tailwind tokens only — `bg-primary`, `text-muted-foreground`,
  `border-border`. Never `bg-blue-500` or a hardcoded hex. Palette is OKLCH,
  defined at `:root` in `src/app/globals.css`.
- Light and dark themes both ship. Dark mode was reinstated in Phase 2
  (`next-themes`, `attribute="class"`, 3-state light/dark/system); the `.dark`
  OKLCH palette is defined in `src/app/globals.css`. Phase 1 had disabled it
  because components used a fixed light palette — that is why the token rule
  above is load-bearing: a hardcoded color renders dark-on-dark.
- Never hand-roll a primitive that exists in `src/components/ui/`.
- RLS on every user-scoped table. Verify with role-switched queries; don't
  assume a policy works because it exists.
- ISQ scoring is a reconstruction, not from source data. Isolated to
  `features/onboarding/questions.ts` and `scoring.ts` for that reason — change
  both together and update the tests.
- Cross-feature imports run one way only: `onboarding` and `dashboard` may
  import `auth`; `auth` imports neither. Auth owns credentials, the session,
  the `users` row and the `OnboardingStep` type. Onboarding owns the two
  screens a new account walks through and everything only they use.

## Commands

```
npm run lint · npm run typecheck · npm run build · npm test
```

## Deeper context

- `CONTEXT.md` — domain vocabulary, architecture decisions
- `PROGRESS.md` — phase log, known issues, what's blocked on Carlos
- `EXTERNAL_SERVICES.md` — every API and MCP server this project touches,
  runtime vs. dev-time

## A note for non-Claude agents reading this file

This file used to differ from `CLAUDE.md` by mechanically swapping "Claude"
for "Codex" throughout — including in real identifiers, which turned into a
factual error: it claimed a `Codex.ts` service file and a "Codex API" that do
not exist anywhere in this codebase. The actual file is `core/services/
claude.ts`, calling Anthropic's Claude API, and that does not change based on
which agent is reading these instructions. Whatever agent you are, describe
the codebase as it actually is — this file and `CLAUDE.md` should always say
the same thing about the code, even where their framing differs.
