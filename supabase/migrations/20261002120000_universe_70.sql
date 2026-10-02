-- Papaldo v0.6 (Carlos, 2026-10-02): the buyable universe grows from 50 to 70,
-- spreading beyond Technology, Finance and FMCG into the other large sectors
-- of the US market. Prices still come from one batched Alpaca snapshot call,
-- so 70 names cost the same single request as 50.
--
-- Market caps start null: python/market_caps.py fills them on its next run
-- (the heatmap sizes a capless stock by its sector's median meanwhile).
-- Risk tiers follow the existing convention (per name, used by the quiz's
-- recommendations): steadier, dividend-paying names conservative, broad
-- large caps moderate, the most volatile aggressive.

insert into public.tradable_assets (symbol, name, asset_class, sector, risk_tier)
values
  ('LLY',  'Eli Lilly and Company',                 'equity', 'Healthcare',    'moderate'),
  ('UNH',  'UnitedHealth Group Incorporated',       'equity', 'Healthcare',    'moderate'),
  ('JNJ',  'Johnson & Johnson',                     'equity', 'Healthcare',    'conservative'),
  ('ABBV', 'AbbVie Inc.',                           'equity', 'Healthcare',    'moderate'),
  ('MRK',  'Merck & Co., Inc.',                     'equity', 'Healthcare',    'conservative'),
  ('XOM',  'Exxon Mobil Corporation',               'equity', 'Energy',        'moderate'),
  ('CVX',  'Chevron Corporation',                   'equity', 'Energy',        'moderate'),
  ('GE',   'GE Aerospace',                          'equity', 'Industrials',   'moderate'),
  ('CAT',  'Caterpillar Inc.',                      'equity', 'Industrials',   'moderate'),
  ('HON',  'Honeywell International Inc.',          'equity', 'Industrials',   'moderate'),
  ('UNP',  'Union Pacific Corporation',             'equity', 'Industrials',   'conservative'),
  ('TSLA', 'Tesla, Inc.',                           'equity', 'Consumer',      'aggressive'),
  ('HD',   'The Home Depot, Inc.',                  'equity', 'Consumer',      'moderate'),
  ('MCD',  'McDonald''s Corporation',               'equity', 'Consumer',      'conservative'),
  ('NKE',  'NIKE, Inc.',                            'equity', 'Consumer',      'moderate'),
  ('NFLX', 'Netflix, Inc.',                         'equity', 'Communication', 'aggressive'),
  ('DIS',  'The Walt Disney Company',               'equity', 'Communication', 'moderate'),
  ('NEE',  'NextEra Energy, Inc.',                  'equity', 'Utilities',     'conservative'),
  ('PLD',  'Prologis, Inc.',                        'equity', 'Real Estate',   'moderate'),
  ('LIN',  'Linde plc',                             'equity', 'Materials',     'moderate')
on conflict (symbol) do update
  set name = excluded.name,
      sector = excluded.sector,
      risk_tier = excluded.risk_tier,
      active = true;
