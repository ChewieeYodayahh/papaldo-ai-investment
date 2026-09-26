-- Profile dashboard + setup journey (2026-09-26): annual and ideal income,
-- each stored in the currency the user typed it in. This is the user's own
-- input, not a converted figure, so it keeps its currency rather than being
-- normalised to USD. Nullable: both are optional setup steps.
--
-- Applied live via the Supabase MCP as `user_income_fields`. No grant change
-- is needed: `authenticated` holds table-level SELECT/UPDATE on users (see
-- restrict_authenticated_table_grants), which covers new columns, and the
-- existing own-row policies apply unchanged. Verified with a role-switched
-- query: a stranger's JWT sees and updates 0 rows; anon has no privilege.
alter table public.users
  add column annual_income          numeric(14, 2),
  add column annual_income_currency text,
  add column ideal_income           numeric(14, 2),
  add column ideal_income_currency  text;

alter table public.users
  add constraint users_annual_income_nonneg check (annual_income is null or annual_income >= 0),
  add constraint users_ideal_income_nonneg  check (ideal_income  is null or ideal_income  >= 0),
  add constraint users_annual_income_currency_valid
    check (annual_income_currency is null or annual_income_currency in ('USD', 'PHP')),
  add constraint users_ideal_income_currency_valid
    check (ideal_income_currency is null or ideal_income_currency in ('USD', 'PHP')),
  -- An amount without a currency is meaningless; a currency without an amount is harmless.
  add constraint users_annual_income_has_currency
    check (annual_income is null or annual_income_currency is not null),
  add constraint users_ideal_income_has_currency
    check (ideal_income is null or ideal_income_currency is not null);

comment on column public.users.annual_income is 'Self-reported annual income, in annual_income_currency. Never converted server-side.';
comment on column public.users.ideal_income is 'Self-reported target annual income, in ideal_income_currency. Never converted server-side.';
