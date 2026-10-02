-- Papaldo v0.6 (Carlos, 2026-10-02): what is inside each ETF Papaldo trades,
-- for the "Top holdings" dialog on /markets and the symbol pages.
--
-- Written weekly only by python/etf_profiles.py (Alpha Vantage ETF_PROFILE)
-- with the service-role key; read by everyone, guests included, like
-- cpi_annual and market_benchmarks. No client role can write it.
--
-- Only the ten largest holdings are kept (a fund like VTI holds thousands);
-- holdings_count says how many there are in all, and source_url links to the
-- fund issuer's own page for the full list and the prospectus.

create table public.etf_profiles (
  symbol          text primary key references public.tradable_assets (symbol) on delete cascade,
  net_assets      numeric check (net_assets is null or net_assets >= 0),
  expense_ratio   numeric check (expense_ratio is null or expense_ratio between 0 and 1),
  dividend_yield  numeric check (dividend_yield is null or dividend_yield between 0 and 1),
  inception_date  date,
  holdings_count  integer not null default 0 check (holdings_count >= 0),
  top_holdings    jsonb not null default '[]'::jsonb check (jsonb_typeof(top_holdings) = 'array'),
  sectors         jsonb not null default '[]'::jsonb check (jsonb_typeof(sectors) = 'array'),
  source_url      text not null check (source_url ~ '^https://'),
  as_of           timestamptz not null,
  updated_at      timestamptz not null default now()
);

alter table public.etf_profiles enable row level security;
revoke all on public.etf_profiles from anon, authenticated;
grant select on public.etf_profiles to anon, authenticated;
create policy etf_profiles_read on public.etf_profiles for select to anon, authenticated using (true);

comment on table public.etf_profiles is
  'Per-ETF facts and top-10 holdings (Alpha Vantage ETF_PROFILE). Written by python/etf_profiles.py only.';
comment on column public.etf_profiles.top_holdings is '[{symbol, name, weight}] largest first, weight as a fraction (0.08 = 8%).';
comment on column public.etf_profiles.sectors is '[{sector, weight}] largest first, weight as a fraction.';
