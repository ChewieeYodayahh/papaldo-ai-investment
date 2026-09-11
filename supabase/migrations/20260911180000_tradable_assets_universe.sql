-- Papaldo: the curated buyable universe.
--
-- `/markets` keeps browsing Alpaca's full catalogue (8,515 tradable NASDAQ and
-- NYSE names) unchanged -- that stays a view. This table is the much smaller
-- set an order may actually be placed against, and it exists because the
-- advisory engine can only advise on assets it has modelled.
--
-- Enforced in place_order for the same reason PA006 is: the function is
-- reachable directly at /rest/v1/rpc/place_order by any signed-in user, so a
-- filter that lived only in the UI would be decoration.
--
-- All 41 symbols were verified present and tradable on Alpaca on 2026-09-11,
-- and every `name` below is Alpaca's own, not typed by hand. `BRK.B` is the
-- correct format for Berkshire Hathaway Class B; `BRK/B`, `BRKB` and `BRK-B`
-- are all absent from the catalogue.

create table public.tradable_assets (
  symbol      text primary key,
  name        text not null,
  asset_class text not null check (asset_class in ('equity', 'crypto')),
  -- Sector is descriptive. 'ETF' is not a sector in any classification
  -- standard, but it is the distinction that matters here: a fund and a
  -- single name behave differently in an allocation even at the same tier.
  sector      text not null,
  -- Deliberately NOT the same vocabulary as risk_profiles.band
  -- ('Low'/'Medium'/'High'). A band describes a person; a tier describes an
  -- asset, and an aggressive portfolio still holds conservative assets. The
  -- modelling job maps between them; nothing else should assume they are the
  -- same axis.
  risk_tier   text not null check (risk_tier in ('conservative', 'moderate', 'aggressive')),
  -- Soft delete. Removing a symbol from the universe must never delete the
  -- row, because holdings and orders reference symbols that may leave it.
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.tradable_assets is
  'The curated set an order may be placed against. Smaller than what /markets browses, on purpose: the advisory engine can only advise on assets it models.';

create index tradable_assets_active_idx on public.tradable_assets (active, risk_tier);

insert into public.tradable_assets (symbol, name, asset_class, sector, risk_tier) values
  ('NVDA', 'NVIDIA Corporation Common Stock', 'equity', 'Technology', 'aggressive'),
  ('AMD', 'Advanced Micro Devices, Inc. Common Stock', 'equity', 'Technology', 'aggressive'),
  ('AAPL', 'Apple Inc. Common Stock', 'equity', 'Technology', 'aggressive'),
  ('GOOG', 'Alphabet Inc. Class C Capital Stock', 'equity', 'Technology', 'aggressive'),
  ('MSFT', 'Microsoft Corporation Common Stock', 'equity', 'Technology', 'aggressive'),
  ('AMZN', 'Amazon.com, Inc. Common Stock', 'equity', 'Technology', 'aggressive'),
  ('META', 'Meta Platforms, Inc. Class A Common Stock', 'equity', 'Technology', 'aggressive'),
  ('TSM', 'Taiwan Semiconductor Manufacturing Company Ltd.', 'equity', 'Technology', 'aggressive'),
  ('PG', 'Procter & Gamble Company', 'equity', 'FMCG', 'conservative'),
  ('KO', 'Coca-Cola Company', 'equity', 'FMCG', 'conservative'),
  ('PEP', 'PepsiCo, Inc. Common Stock', 'equity', 'FMCG', 'conservative'),
  ('COST', 'Costco Wholesale Corporation Common Stock', 'equity', 'FMCG', 'conservative'),
  ('WMT', 'Walmart Inc. Common Stock', 'equity', 'FMCG', 'conservative'),
  ('MDLZ', 'Mondelez International, Inc. Class A Common Stock', 'equity', 'FMCG', 'conservative'),
  ('CL', 'Colgate-Palmolive Company', 'equity', 'FMCG', 'conservative'),
  ('UL', 'Unilever plc', 'equity', 'FMCG', 'conservative'),
  ('KHC', 'The Kraft Heinz Company Common Stock', 'equity', 'FMCG', 'conservative'),
  ('JPM', 'JPMorgan Chase & Co.', 'equity', 'Finance', 'moderate'),
  ('BAC', 'Bank of America Corporation', 'equity', 'Finance', 'moderate'),
  ('GS', 'Goldman Sachs Group Inc.', 'equity', 'Finance', 'moderate'),
  ('MA', 'Mastercard Incorporated', 'equity', 'Finance', 'moderate'),
  ('V', 'VISA Inc.', 'equity', 'Finance', 'moderate'),
  ('MS', 'Morgan Stanley', 'equity', 'Finance', 'moderate'),
  ('SCHW', 'The Charles Schwab Corporation', 'equity', 'Finance', 'moderate'),
  ('AXP', 'American Express Company', 'equity', 'Finance', 'moderate'),
  ('BRK.B', 'BERKSHIRE HATHAWAY Class B', 'equity', 'Finance', 'moderate'),
  ('QQQ', 'Invesco QQQ Trust, Series 1', 'equity', 'ETF', 'aggressive'),
  ('VGT', 'Vanguard Information Technology ETF', 'equity', 'ETF', 'aggressive'),
  ('VUG', 'Vanguard Morningstar Growth ETF', 'equity', 'ETF', 'aggressive'),
  ('SMH', 'VanEck Semiconductor ETF', 'equity', 'ETF', 'aggressive'),
  -- IBIT gives bitcoin exposure through an ordinary equity wrapper, which is
  -- why V1 needs no crypto code at all: Alpaca lists it as us_equity on
  -- NASDAQ. Native BTC/USD endpoints are probed and working but stay unwired.
  ('IBIT', 'iShares Bitcoin Trust ETF Shares', 'equity', 'ETF', 'aggressive'),
  ('VOO', 'Vanguard S&P 500 ETF', 'equity', 'ETF', 'moderate'),
  ('VTI', 'Vanguard Morningstar Total Stock Market ETF', 'equity', 'ETF', 'moderate'),
  ('SPMO', 'Invesco S&P 500 Momentum ETF', 'equity', 'ETF', 'moderate'),
  ('VXUS', 'Vanguard STAR Funds Vanguard Total International Stock ETF', 'equity', 'ETF', 'moderate'),
  ('IEMG', 'iShares Core MSCI Emerging Markets ETF', 'equity', 'ETF', 'moderate'),
  -- The conservative tier is all equity. Bond ETFs (AGG/BND/SHY) were cut
  -- 2026-09-11, consistent with dropping fixed income entirely -- no proxies.
  -- USMV is the min-volatility factor, the closest equity-only stand-in for
  -- the defensive role bonds played; VYM, SCHD and DGRO differ by index
  -- methodology (broad yield, quality screen, dividend growth) rather than
  -- being three names for one thing.
  ('SCHD', 'Schwab US Dividend Equity ETF', 'equity', 'ETF', 'conservative'),
  ('VIG', 'Vanguard Dividend Appreciation ETF', 'equity', 'ETF', 'conservative'),
  ('USMV', 'iShares MSCI USA Min Vol Factor ETF', 'equity', 'ETF', 'conservative'),
  ('VYM', 'Vanguard High Dividend Yield ETF', 'equity', 'ETF', 'conservative'),
  ('DGRO', 'iShares Core Dividend Growth ETF', 'equity', 'ETF', 'conservative');

-- ---------------------------------------------------------------------------
-- RLS: everyone signed in may read the universe; nobody may write it. It
-- changes by migration, not by request.
-- ---------------------------------------------------------------------------
alter table public.tradable_assets enable row level security;

create policy tradable_assets_select_all on public.tradable_assets
  for select to authenticated
  using (true);

revoke all on public.tradable_assets from anon, authenticated;
grant select on public.tradable_assets to authenticated;

-- ---------------------------------------------------------------------------
-- place_order gains PA007. Restated in full; plpgsql has no partial replace.
-- Unchanged from 20260911160000 apart from the one new check.
-- ---------------------------------------------------------------------------
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

  if p_side = 'buy' and not exists (
    select 1 from public.risk_profiles rp where rp.user_id = v_user_id
  ) then
    raise exception 'Take the Investment Suitability Questionnaire before buying.'
      using errcode = 'PA006';
  end if;

  -- Buys only, for the same reason PA006 is buys only: a symbol retired from
  -- the universe must never strand whoever already holds it.
  if p_side = 'buy' and not exists (
    select 1 from public.tradable_assets ta
    where ta.symbol = p_symbol and ta.active
  ) then
    raise exception '% is not in the advised universe.', p_symbol using errcode = 'PA007';
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
      delete from public.holdings where id = v_holding.id;
    else
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
  'Atomically validates and applies one simulated order. Buys require a risk profile and a symbol in tradable_assets; sells require neither, so a position can always be exited. The only write path to portfolios.cash_balance and holdings.';

-- ---------------------------------------------------------------------------
-- Applied immediately after the above (2026-09-11): /markets is a public page
-- and builds its featured row from this table, so a signed-out visitor was
-- getting an empty row. The universe is a list of tickers, not user data, and
-- the policy predicate was already `using (true)` -- this extends the same
-- read to the anonymous role rather than loosening anything.
-- ---------------------------------------------------------------------------
drop policy tradable_assets_select_all on public.tradable_assets;

create policy tradable_assets_select_all on public.tradable_assets
  for select to anon, authenticated
  using (true);

grant select on public.tradable_assets to anon;
