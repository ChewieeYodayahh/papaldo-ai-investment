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
- Feature roots. Nested folders are features of their own: `community/blog`,
  `markets/benchmarks`, `tools/calculators`, `tools/quiz`, `userData/export`,
  `userData/frame` (AppShell, PublicShell, header, sidebar, menus, nav) and
  `userData/preferences` (store, `<Money>`, copy).
- Cross-feature imports run one way only (checked 2026-09-30):
  - `userData/preferences` imports no feature; `auth` imports only it.
  - `trading` and `community` import `auth`; `community/blog` imports none.
  - `tools/quiz` imports `auth`; `tools/calculators` imports no feature but
    preferences; the `tools` hub imports `auth`, `markets/benchmarks`,
    `tools/quiz` and `tutorials`.
  - `markets` imports `trading` and `tools/quiz` (read-only risk profile for
    the buy gate); `markets/benchmarks` imports `markets` and
    `tools/calculators`; `advisory` imports `markets`.
  - `tutorials` imports `auth`, `trading` and `tools/quiz` (read-only), and
    **never** `userData/frame`: the frame mounts tutorials, not the reverse.
    Shared types such as `SetupProgress` live in `tutorials/types.ts`.
  - `userData/frame` wraps pages and may import `auth`, `trading`,
    `markets` (`SymbolMark`), `tools/quiz` (read-only), `tutorials`. Pages
    (`dashboard`, `landing`, `support`, `admin`) import the frame; nothing the
    frame imports may import it back.
  - `userData/export` reads `auth`, `dashboard`, `markets`, `tools/quiz` and
    `trading`; `dashboard` imports `markets`, `tools/quiz` and `trading`.
  - `admin` may import `auth`, `community/blog`, `userData/export` (formats
    only) and `userData/frame`; nothing imports `admin`.
- Ownership: `auth` owns credentials, the session, the `users` row and the
  `OnboardingStep` type. `tools/quiz` owns the ISQ. `tutorials` owns first-
  time setup: the profile setup journey (`/onboarding/profile`), the Get
  Started dock, the welcome carousel and the walkthroughs.
- Only a username is required before the app opens (middleware). Contact,
  occupation and income are the optional setup journey; the quiz is never a
  gate. After login, everyone lands on `/dashboard`.
