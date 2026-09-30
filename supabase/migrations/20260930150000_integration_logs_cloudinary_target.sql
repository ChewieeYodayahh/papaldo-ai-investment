-- Profile pictures upload to Cloudinary (v0.5); log those calls like every
-- other outside service.
alter table public.integration_logs drop constraint integration_logs_target_check;
alter table public.integration_logs add constraint integration_logs_target_check
  check (target in ('alpaca', 'finnhub', 'exchange-rate', 'claude', 'gemini', 'supabase-auth', 'yahoo', 'stooq', 'cloudinary'));
