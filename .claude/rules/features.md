---
paths:
  - "src/app/features/**"
  - "src/app/api/**"
  - "src/app/**/page.tsx"
  - "src/app/**/layout.tsx"
  - "src/middleware.ts"
---

# Feature and route rules

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
