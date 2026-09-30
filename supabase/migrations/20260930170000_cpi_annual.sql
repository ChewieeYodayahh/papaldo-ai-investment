-- Papaldo v0.5: consumer price index by year for the Purchasing Power
-- calculator (Carlos, 2026-09-30).
--
-- Written only by python/cpi.py (World Bank FP.CPI.TOTL, 2010 = 100) with the
-- service-role key; read by everyone, guests included, like market_benchmarks.
-- No client role can write it.

create table public.cpi_annual (
  country     text not null check (country in ('USA', 'PHL')),
  year        integer not null check (year between 1900 and 2200),
  cpi         numeric not null check (cpi > 0),
  source      text not null,
  updated_at  timestamptz not null default now(),
  primary key (country, year)
);

alter table public.cpi_annual enable row level security;
revoke all on public.cpi_annual from anon, authenticated;
grant select on public.cpi_annual to anon, authenticated;
create policy cpi_annual_read on public.cpi_annual for select to anon, authenticated using (true);

comment on table public.cpi_annual is
  'Consumer price index by year (World Bank FP.CPI.TOTL, 2010 = 100) for USA and PHL. Written by python/cpi.py only.';
