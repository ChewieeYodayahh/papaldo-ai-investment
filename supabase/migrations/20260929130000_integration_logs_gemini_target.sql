-- core/services/claude.ts routes AI calls through the Gemini adapter
-- (gemini-2.5-flash), so those calls are logged under their real provider.
alter table public.integration_logs drop constraint integration_logs_target_check;
alter table public.integration_logs add constraint integration_logs_target_check
  check (target in ('alpaca', 'finnhub', 'exchange-rate', 'claude', 'gemini', 'supabase-auth', 'yahoo', 'stooq'));
