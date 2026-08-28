# features/dashboard

Deliberately empty. The dashboard build -- portfolio allocation, holdings,
simulated orders, watchlists and the Recharts visualisations -- is a separate
assignment.

What exists today is `app/(app)/dashboard/page.tsx`, a placeholder shell that
displays the risk profile produced by `features/isq` and nothing more.

When this feature is built, it owns its own `components/`, `api/`, `types.ts`
and reads the current profile from `risk_profiles` (one row per user, always
the latest ISQ result). Historical scores live in `isq_responses`.
