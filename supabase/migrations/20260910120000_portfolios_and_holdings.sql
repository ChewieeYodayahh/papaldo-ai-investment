-- Papaldo: portfolios + holdings
-- Every account gets exactly one simulated portfolio, seeded with a starting
-- cash balance on signup (Carlos's explicit instruction, 2026-09-10: $500,000
-- demo balance, USD). holdings starts empty and stays empty for every
-- account until Trading (order placement) ships -- no positions are
-- fabricated here. This mirrors risk_profiles' one-row-per-user pattern.

-- ---------------------------------------------------------------------------
-- portfolios: one row per user, created by a trigger alongside handle_new_user.
-- cash_balance is not user-writable -- see grants below. The only way it
-- changes today is the DEFAULT at insert time; a later Trading feature will
-- need its own SECURITY DEFINER function to debit/credit it, same reasoning
-- as risk_profiles' upsert path.
-- ---------------------------------------------------------------------------
create table public.portfolios (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null unique references auth.users (id) on delete cascade,
  cash_balance numeric(14,2) not null default 500000.00 check (cash_balance >= 0),
  currency     text        not null default 'USD' check (currency = 'USD'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.portfolios is
  'One simulated portfolio per user, seeded with a $500,000 USD demo cash balance on signup. No real money.';

-- ---------------------------------------------------------------------------
-- holdings: positions within a portfolio. Empty for every account today --
-- there is no order-placement feature yet to populate it. Exists now so the
-- dashboard has a real (if currently always-empty) table to read from instead
-- of a hardcoded sample array.
-- ---------------------------------------------------------------------------
create table public.holdings (
  id           uuid        primary key default gen_random_uuid(),
  portfolio_id uuid        not null references public.portfolios (id) on delete cascade,
  symbol       text        not null,
  quantity     numeric(18,6) not null check (quantity > 0),
  avg_cost     numeric(14,4) not null check (avg_cost >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint holdings_portfolio_symbol_key unique (portfolio_id, symbol)
);

comment on table public.holdings is
  'Simulated positions within a portfolio. Always empty until a Trading/order-placement feature exists to write to it.';

create index holdings_portfolio_idx on public.holdings (portfolio_id);

-- ---------------------------------------------------------------------------
-- Trigger: seed the demo portfolio at signup. A second AFTER INSERT trigger
-- on auth.users, alongside on_auth_user_created -- independent of it (no
-- ordering dependency, both only need new.id).
-- ---------------------------------------------------------------------------
create function public.handle_new_user_portfolio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.portfolios (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user_portfolio() from public, anon, authenticated;

create trigger on_auth_user_created_portfolio
  after insert on auth.users
  for each row execute function public.handle_new_user_portfolio();

create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

create trigger holdings_set_updated_at
  before update on public.holdings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security. Read-only for authenticated on both tables: cash_balance
-- and holdings are not user-writable today, by design -- they only change via
-- SECURITY DEFINER paths (this trigger now, a Trading function later).
-- ---------------------------------------------------------------------------
alter table public.portfolios enable row level security;
alter table public.holdings   enable row level security;

create policy portfolios_select_own on public.portfolios
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy holdings_select_own on public.holdings
  for select to authenticated
  using (
    exists (
      select 1 from public.portfolios p
      where p.id = holdings.portfolio_id
        and p.user_id = (select auth.uid())
    )
  );

revoke all on public.portfolios from anon, authenticated;
revoke all on public.holdings   from anon, authenticated;

grant select on public.portfolios to authenticated;
grant select on public.holdings   to authenticated;
