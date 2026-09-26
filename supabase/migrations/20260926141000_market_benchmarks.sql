-- Stock Exchange Index Benchmarker (Tools, 2026-09-26): monthly closes of
-- the PSEi, NYSE Composite, NASDAQ Composite and S&P 500 over the last 15
-- years, pre-normalised so the chart compares growth rather than points.
--
-- Written only by python/benchmarks.py (service role, bypasses RLS); read by
-- anyone. It is reference market data -- the same rows for every tenant -- so
-- there is no user_id: tenancy applies to rows a user owns, and nobody owns
-- an index. That is also why `anon` may read it, like tradable_assets.
--
--   normalized_growth_value  close / close at the window's first month * 100.
--                            Every index starts at exactly 100, so the lines
--                            show relative growth on one axis even though the
--                            raw levels differ by an order of magnitude.
--   yoy_return_pct           close / close twelve months earlier - 1, in %.
--                            Computed on the full history, so the first year
--                            of the window has a value too. Null only when
--                            the source has no month twelve back.
--   source_symbol            The Yahoo symbol actually fetched. Yahoo has no
--                            PSEi history (PSEI.PS carries one day, ^PSEI
--                            does not exist), so PSEI rows currently come
--                            from EPHE, the iShares MSCI Philippines ETF, in
--                            USD. The UI reads this column and says so.

create table public.market_benchmarks (
  id                      uuid primary key default gen_random_uuid(),
  price_date              date not null,
  ticker                  varchar(12) not null check (ticker in ('PSEI', 'NYSE', 'NASDAQ', 'SP500')),
  source_symbol           varchar(16) not null,
  raw_close_price         numeric(18, 4) not null check (raw_close_price > 0),
  normalized_growth_value numeric(14, 4) not null check (normalized_growth_value > 0),
  yoy_return_pct          numeric(10, 4),
  updated_at              timestamptz not null default now(),
  -- One close per index per month; the pipeline upserts on this key, so a
  -- re-run rewrites rather than duplicates. It also serves the date-ordered
  -- read the benchmarker does.
  constraint market_benchmarks_date_ticker_key unique (price_date, ticker)
);

comment on table public.market_benchmarks is
  'Monthly index closes, normalised to 100 at the window start, with rolling 12-month YoY. Written by python/benchmarks.py.';

alter table public.market_benchmarks enable row level security;

create policy market_benchmarks_select_all on public.market_benchmarks
  for select to anon, authenticated
  using (true);

-- Defence in depth, as elsewhere: read-only grants for client roles, so a
-- future policy mistake cannot open a write path.
revoke all on public.market_benchmarks from anon, authenticated;
grant select on public.market_benchmarks to anon, authenticated;
