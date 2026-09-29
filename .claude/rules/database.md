---
paths:
  - "supabase/**"
  - "src/app/core/services/**"
  - "src/app/features/*/api/**"
  - "src/app/api/**"
  - "src/app/admin/**"
  - "src/app/features/admin/**"
---

# Database, access and logging rules

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
