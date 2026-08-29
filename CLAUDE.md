# Papaldo

AI investment simulation dashboard for Filipino investors. Sign up → 6-item
Investment Suitability Questionnaire → risk band → simulated portfolio.

Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui + Supabase + Claude API.

## Layout

`@/*` → `./src/*`

```
src/app/                    routes — thin composition only, no logic
  (auth)/                   login, sign-up
  (app)/                    dashboard, isq
  api/                      route handlers — delegate to features/*/api
  features/<name>/          owns api/, components/, schema.ts, types.ts
    auth  isq  dashboard  landing
  core/services/            cross-feature only
    claude.ts
    supabase/               client, server, middleware, database.types
src/components/ui/          shadcn primitives (base-nova / mist)
src/components/*.jsx        React Bits components
src/lib/utils.ts            cn()
supabase/migrations/
```

## Rules

- UI never calls Supabase or Claude directly. Route through `src/app/api/*`,
  with the logic in the matching `features/*/api` module, not inline in the
  route handler.
- Colors: Tailwind tokens only — `bg-primary`, `text-muted-foreground`,
  `border-border`. Never `bg-blue-500` or a hardcoded hex. Palette is OKLCH,
  defined at `:root` in `src/app/globals.css`.
- Light theme only. Dark mode was removed deliberately, not skipped — see
  PROGRESS.md before reinstating it.
- Never hand-roll a primitive that exists in `src/components/ui/`.
- RLS on every user-scoped table. Verify with role-switched queries; don't
  assume a policy works because it exists.
- ISQ scoring is a reconstruction, not from source data. Isolated to
  `features/isq/questions.ts` and `scoring.ts` for that reason — change both
  together and update the tests.

## Commands

```
npm run lint · npm run typecheck · npm run build · npm test
```

## Deeper context

- `CONTEXT.md` — domain vocabulary, architecture decisions
- `PROGRESS.md` — phase log, known issues, what's blocked on Carlos
