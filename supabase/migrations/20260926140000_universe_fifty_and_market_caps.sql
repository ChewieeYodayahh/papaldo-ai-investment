-- The buyable universe grows from 41 to 50 (Carlos, 2026-09-26: "make the
-- tradeable stocks go to 50, add more in Technology"), and each asset gains a
-- market capitalisation so the /markets heatmap can size tiles the way
-- Perplexity Finance does.
--
-- The nine names were read from Alpaca's own catalogue through the app on
-- 2026-09-26 -- all active, tradable and fractionable -- and `name` is
-- Alpaca's text verbatim, the same standard as the original 41. Technology
-- goes from 8 to 17; the tier follows the existing Technology rows.
--
-- market_cap_usd is written by python/market_caps.py (yfinance), not typed
-- here: a hand-entered market cap is stale the day it is committed. It is
-- nullable -- ETFs have none, and a new symbol has none until the next run --
-- and the heatmap falls back to its sector's median when it is missing.

alter table public.tradable_assets
  add column market_cap_usd   numeric(20, 0) check (market_cap_usd is null or market_cap_usd > 0),
  add column market_cap_as_of timestamptz;

comment on column public.tradable_assets.market_cap_usd is
  'Latest market capitalisation in USD, from python/market_caps.py (yfinance). Sizes the /markets heatmap. Null for ETFs and until first fetched.';

insert into public.tradable_assets (symbol, name, asset_class, sector, risk_tier) values
  ('AVGO', 'Broadcom Inc. Common Stock', 'equity', 'Technology', 'aggressive'),
  ('ORCL', 'Oracle Corp', 'equity', 'Technology', 'aggressive'),
  ('CRM', 'Salesforce, Inc.', 'equity', 'Technology', 'aggressive'),
  ('ADBE', 'Adobe Inc. Common Stock', 'equity', 'Technology', 'aggressive'),
  ('CSCO', 'Cisco Systems, Inc. Common Stock (DE)', 'equity', 'Technology', 'aggressive'),
  ('QCOM', 'QUALCOMM Incorporated Common Stock', 'equity', 'Technology', 'aggressive'),
  ('IBM', 'International Business Machines Corporation', 'equity', 'Technology', 'aggressive'),
  ('INTC', 'Intel Corporation Common Stock', 'equity', 'Technology', 'aggressive'),
  ('PLTR', 'Palantir Technologies Inc. Class A Common Stock', 'equity', 'Technology', 'aggressive')
on conflict (symbol) do update set active = true;
