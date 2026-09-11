-- Papaldo: output tables for the offline modelling job.
--
-- Written by a GitHub Actions cron (python/model_portfolios.py), never by the
-- app. Same shape as the rest of this schema: the web tier reads, something
-- else writes, and the write path holds the only credential that can.
--
-- Neither table is user-scoped. There is one model portfolio per risk band,
-- not per person, which is what keeps the advisory cost flat as users grow.

-- ---------------------------------------------------------------------------
-- market_signals: per-symbol inputs the allocation was derived from.
--
-- Kept rather than discarded so a weight can be explained after the fact. When
-- someone asks why the aggressive band holds less NVDA this month, the answer
-- is in this table, not in a rerun of the model.
-- ---------------------------------------------------------------------------
create table public.market_signals (
  symbol             text        not null references public.tradable_assets (symbol),
  as_of_date         date        not null,
  -- Annualised, computed from daily bars. Nullable because a symbol with too
  -- little history yields no meaningful estimate, and a null is honest where
  -- a zero would read as "flat".
  trailing_return    numeric(10,6),
  volatility         numeric(10,6),
  sharpe             numeric(10,6),
  /** Bars actually used. A weight derived from 30 days is not the same claim
      as one derived from 250, and the reader deserves to know which. */
  observations       integer     not null,
  created_at         timestamptz not null default now(),
  primary key (symbol, as_of_date)
);

comment on table public.market_signals is
  'Per-symbol return/volatility inputs behind each model portfolio. Written by the offline job only.';

-- ---------------------------------------------------------------------------
-- model_portfolios: the target allocation per risk band.
--
-- `risk_band` uses risk_profiles' vocabulary ('Low'/'Medium'/'High') because
-- this table is joined to a *person's* band. tradable_assets.risk_tier uses
-- conservative/moderate/aggressive because that describes an *asset*. The job
-- maps between them; nothing else should treat them as one axis.
-- ---------------------------------------------------------------------------
create table public.model_portfolios (
  risk_band     text          not null check (risk_band in ('Low', 'Medium', 'High')),
  symbol        text          not null references public.tradable_assets (symbol),
  -- Weights within a band and date sum to 1. Not enforced by a constraint,
  -- because a row-level check cannot see the set; the job asserts it instead.
  target_weight numeric(8,6)  not null check (target_weight >= 0 and target_weight <= 1),
  as_of_date    date          not null,
  /** How the weights were produced, e.g. 'min_volatility' or 'max_sharpe'.
      Stored because the method differs per band and changing it changes what
      the numbers mean. */
  method        text          not null,
  created_at    timestamptz   not null default now(),
  primary key (risk_band, symbol, as_of_date)
);

comment on table public.model_portfolios is
  'Target allocation per risk band and date. One row set per band, not per user, so advisory cost stays flat.';

create index model_portfolios_band_date_idx on public.model_portfolios (risk_band, as_of_date desc);

-- ---------------------------------------------------------------------------
-- RLS: signed-in users read; nobody writes through the API. The job uses the
-- service role, which bypasses RLS and is never given to the app.
-- ---------------------------------------------------------------------------
alter table public.market_signals   enable row level security;
alter table public.model_portfolios enable row level security;

create policy market_signals_select on public.market_signals
  for select to authenticated using (true);

create policy model_portfolios_select on public.model_portfolios
  for select to authenticated using (true);

revoke all on public.market_signals   from anon, authenticated;
revoke all on public.model_portfolios from anon, authenticated;
grant select on public.market_signals   to authenticated;
grant select on public.model_portfolios to authenticated;
