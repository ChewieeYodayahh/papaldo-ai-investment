-- Papaldo: a buy requires a risk profile.
--
-- Carlos's call, 2026-09-11. Removing the ISQ redirect earlier the same day
-- meant the risk band no longer constrained anything at all -- a user could
-- reach the dashboard, skip the questionnaire, and trade. This puts the
-- constraint back where it cannot be skipped.
--
-- Enforced here rather than only in the route because `place_order` is
-- reachable directly at /rest/v1/rpc/place_order by any signed-in user. A
-- check that lives only in the UI or the handler is a suggestion.
--
-- **Sells stay allowed without a risk profile, deliberately.** Anyone holding
-- a position must be able to exit it. Gating the exit would trap a user whose
-- profile was never taken, or was somehow removed, in a position they cannot
-- close -- a far worse outcome than an untailored buy.
--
-- Everything else in this function is unchanged from
-- 20260911140000_orders_and_place_order.sql; it is restated in full because
-- plpgsql has no partial replace.

create or replace function public.place_order(
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

  -- The new rule. Buys only.
  if p_side = 'buy' and not exists (
    select 1 from public.risk_profiles rp where rp.user_id = v_user_id
  ) then
    raise exception 'Take the Investment Suitability Questionnaire before buying.'
      using errcode = 'PA006';
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
  'Atomically validates and applies one simulated order. Buys require a risk profile; sells never do, so a position can always be exited. The only write path to portfolios.cash_balance and holdings.';
