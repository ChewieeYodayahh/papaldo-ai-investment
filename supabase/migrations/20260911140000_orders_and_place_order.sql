-- Papaldo: simulated buy/sell orders.
--
-- Every order is simulated. Nothing here reaches a broker: the fill price is
-- a live Alpaca quote read server-side, and the money is the $500,000 demo
-- balance seeded at signup. Alpaca's own paper account is never touched.
--
-- The whole write path is one SECURITY DEFINER function. `authenticated` gets
-- EXECUTE on it and no INSERT/UPDATE/DELETE grant on any table it writes, so
-- the only way a balance or a position can change is through code that checks
-- it first. Same reasoning as handle_new_user_portfolio: RLS decides who may
-- *read* a row, and a definer function decides how a row may *change*.

-- ---------------------------------------------------------------------------
-- holdings.asset_class -- crypto trades alongside equities and the two are
-- priced from different Alpaca namespaces, so a position has to say which.
-- Existing rows are equities by construction (holdings was empty until now).
-- ---------------------------------------------------------------------------
alter table public.holdings
  add column asset_class text not null default 'equity'
    check (asset_class in ('equity', 'crypto'));

comment on column public.holdings.asset_class is
  'Which Alpaca namespace prices this position: equity (/v2/stocks) or crypto (/v1beta3/crypto).';

-- ---------------------------------------------------------------------------
-- orders: the immutable record of what was filled. Append-only by design --
-- no UPDATE or DELETE path exists, same as isq_responses. A mistaken buy is
-- corrected by selling, not by editing history.
-- ---------------------------------------------------------------------------
create table public.orders (
  id           uuid          primary key default gen_random_uuid(),
  portfolio_id uuid          not null references public.portfolios (id) on delete cascade,
  symbol       text          not null,
  asset_class  text          not null check (asset_class in ('equity', 'crypto')),
  side         text          not null check (side in ('buy', 'sell')),
  quantity     numeric(18,6) not null check (quantity > 0),
  fill_price   numeric(14,4) not null check (fill_price > 0),
  -- Denormalised on purpose: quantity x price rounded to cash scale is the
  -- amount that actually moved, and recomputing it later from two rounded
  -- columns will not always reproduce it.
  cash_amount  numeric(14,2) not null check (cash_amount >= 0),
  filled_at    timestamptz   not null default now(),
  created_at   timestamptz   not null default now()
);

comment on table public.orders is
  'Append-only record of simulated fills. No broker involved; fill_price is a live Alpaca quote at submit time.';

create index orders_portfolio_filled_idx on public.orders (portfolio_id, filled_at desc);

-- ---------------------------------------------------------------------------
-- place_order: validate, move cash, move the position, record the fill.
--
-- search_path is pinned empty and every name is schema-qualified, so an
-- attacker-controlled search_path cannot shadow a table or function that this
-- runs as definer.
-- ---------------------------------------------------------------------------
create function public.place_order(
  p_symbol      text,
  p_asset_class text,
  p_side        text,
  p_quantity    numeric,
  p_fill_price  numeric
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_user_id   uuid := (select auth.uid());
  v_portfolio public.portfolios%rowtype;
  v_holding   public.holdings%rowtype;
  v_amount    numeric(14,2);
  v_order     public.orders%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not signed in.' using errcode = 'PA004';
  end if;

  if p_side not in ('buy', 'sell') then
    raise exception 'Side must be buy or sell.' using errcode = 'PA005';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero.' using errcode = 'PA005';
  end if;

  if p_fill_price is null or p_fill_price <= 0 then
    raise exception 'Fill price must be greater than zero.' using errcode = 'PA005';
  end if;

  -- FOR UPDATE serialises concurrent orders on the same portfolio. Without it
  -- two overlapping buys can both read the same balance and both pass the
  -- funds check, overdrawing an account that has a non-negative constraint.
  select * into v_portfolio
  from public.portfolios
  where user_id = v_user_id
  for update;

  if v_portfolio.id is null then
    raise exception 'No portfolio for this account.' using errcode = 'PA003';
  end if;

  -- Rounded to the cash column's own scale. Comparing an unrounded product
  -- against a rounded balance is how a portfolio ends up a cent overdrawn.
  v_amount := round(p_quantity * p_fill_price, 2);

  select * into v_holding
  from public.holdings
  where portfolio_id = v_portfolio.id
    and symbol = p_symbol
  for update;

  if p_side = 'buy' then
    if v_portfolio.cash_balance < v_amount then
      raise exception 'Not enough cash: % available, % needed.',
        v_portfolio.cash_balance, v_amount using errcode = 'PA001';
    end if;

    update public.portfolios
    set cash_balance = cash_balance - v_amount
    where id = v_portfolio.id;

    if v_holding.id is not null then
      -- Weighted average cost, computed from the pre-trade position.
      update public.holdings
      set quantity = v_holding.quantity + p_quantity,
          avg_cost = round(
            ((v_holding.quantity * v_holding.avg_cost) + (p_quantity * p_fill_price))
              / (v_holding.quantity + p_quantity),
            4
          )
      where id = v_holding.id;
    else
      insert into public.holdings (portfolio_id, symbol, asset_class, quantity, avg_cost)
      values (v_portfolio.id, p_symbol, p_asset_class, p_quantity, round(p_fill_price, 4));
    end if;

  else
    if v_holding.id is null then
      raise exception 'No position in % to sell.', p_symbol using errcode = 'PA002';
    end if;

    if v_holding.quantity < p_quantity then
      raise exception 'Not enough shares: % held, % requested.',
        v_holding.quantity, p_quantity using errcode = 'PA002';
    end if;

    update public.portfolios
    set cash_balance = cash_balance + v_amount
    where id = v_portfolio.id;

    if v_holding.quantity = p_quantity then
      -- holdings.quantity carries a > 0 check, so a flat position is deleted
      -- rather than zeroed.
      delete from public.holdings where id = v_holding.id;
    else
      -- avg_cost deliberately unchanged: selling realises gain or loss, it
      -- does not re-price what is left.
      update public.holdings
      set quantity = v_holding.quantity - p_quantity
      where id = v_holding.id;
    end if;
  end if;

  insert into public.orders (portfolio_id, symbol, asset_class, side, quantity, fill_price, cash_amount)
  values (v_portfolio.id, p_symbol, p_asset_class, p_side, p_quantity, p_fill_price, v_amount)
  returning * into v_order;

  return v_order;
end;
$fn$;

comment on function public.place_order is
  'Atomically validates and applies one simulated order. The only write path to portfolios.cash_balance and holdings.';

revoke execute on function public.place_order(text, text, text, numeric, numeric) from public, anon;
grant  execute on function public.place_order(text, text, text, numeric, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: read your own orders, write nothing directly.
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;

create policy orders_select_own on public.orders
  for select to authenticated
  using (
    exists (
      select 1 from public.portfolios p
      where p.id = orders.portfolio_id
        and p.user_id = (select auth.uid())
    )
  );

revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
