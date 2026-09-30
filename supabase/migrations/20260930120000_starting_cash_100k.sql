-- Papaldo v0.5: new accounts start with $100,000 (Carlos, 2026-09-30: "so it
-- feels challenging"). Existing accounts keep what they have; only the default
-- for new portfolios changes. The amount is USD and is shown in pesos at the
-- live rate by <Money>, like every other figure.

alter table public.portfolios
  alter column cash_balance set default 100000.00;

comment on table public.portfolios is
  'One simulated portfolio per user. New accounts are seeded with $100,000 USD of demo cash (accounts created before 2026-09-30 started with $500,000). No real money.';

-- ---------------------------------------------------------------------------
-- my_starting_cash(): what the caller's account started with, derived instead
-- of stored. place_order() is the only writer of cash_balance and orders is
-- append-only with the exact cash that moved, so
--     starting cash = cash now + sum(buys) - sum(sells)
-- holds exactly for every account, old or new. Computed in SQL because a
-- client-side sum over orders is capped at PostgREST's 1,000-row page.
--
-- SECURITY INVOKER: it runs with the caller's own RLS, so it can only ever see
-- the caller's portfolio and orders. Null when the caller has no portfolio.
-- ---------------------------------------------------------------------------
create or replace function public.my_starting_cash()
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select p.cash_balance + coalesce((
    select sum(case o.side when 'buy' then o.cash_amount else -o.cash_amount end)
    from public.orders o
    where o.portfolio_id = p.id
  ), 0)
  from public.portfolios p
  where p.user_id = (select auth.uid())
$$;

comment on function public.my_starting_cash() is
  'The calling user''s starting cash, derived as cash_balance + buys - sells. Runs under the caller''s RLS.';

revoke all on function public.my_starting_cash() from public, anon;
grant execute on function public.my_starting_cash() to authenticated;
