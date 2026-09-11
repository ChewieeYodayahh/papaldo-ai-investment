-- Papaldo: cached market outlooks per risk band.
-- Written by the advisory service on first request per day, then reused
-- until midnight. Keeps Gemini calls flat regardless of concurrent users.

create table public.market_outlooks (
  risk_band     text          not null check (risk_band in ('Low', 'Medium', 'High')),
  as_of_date    date          not null default current_date,
  outlook_text  text          not null,
  model_used    text          not null default 'gemini-2.5-flash',
  context_pct   numeric(5,2)  not null default 0,
  created_at    timestamptz   not null default now(),
  primary key (risk_band, as_of_date)
);

comment on table public.market_outlooks is
  'Cached AI-generated market outlook per risk band. One row per band per day, written on first advisory request then reused.';

alter table public.market_outlooks enable row level security;

create policy market_outlooks_select on public.market_outlooks
  for select to authenticated using (true);

revoke all on public.market_outlooks from anon, authenticated;
grant select on public.market_outlooks to authenticated;
