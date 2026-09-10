-- Papaldo: backfill demo portfolios for accounts that predate the trigger.
--
-- Why this exists: on_auth_user_created_portfolio (20260910120000) fires only
-- on INSERT into auth.users. Every account created before that migration ran
-- therefore has no portfolios row, and the dashboard renders its "No portfolio
-- found for this account" fallback for them. Signing out and back in does not
-- help -- the trigger is on signup, not on sign-in.
--
-- Idempotent on purpose: safe to re-run, and safe to leave in the migration
-- history once no account is missing a row. cash_balance/currency are left to
-- the table DEFAULTs so the seeded balance is defined in exactly one place
-- (the portfolios DDL), never duplicated here.
insert into public.portfolios (user_id)
select u.id
from auth.users u
left join public.portfolios p on p.user_id = u.id
where p.id is null
on conflict (user_id) do nothing;
