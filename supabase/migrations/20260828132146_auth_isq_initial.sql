-- Papaldo: Registration/Auth + Investment Suitability Questionnaire
-- Scope: users, isq_responses, risk_profiles only.
-- portfolios/holdings/assets/simulated_orders/watchlists are a later phase.

-- ---------------------------------------------------------------------------
-- users: profile mirror of auth.users. Not a hand-rolled auth table.
-- username/contact/occupation are nullable so a Google OAuth signup can create
-- a row before the complete-profile step fills them in. "Profile complete"
-- means all three are non-null.
-- ---------------------------------------------------------------------------
create table public.users (
  id          uuid        primary key references auth.users (id) on delete cascade,
  username    text,
  email       text        not null,
  contact     text,
  occupation  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint users_username_length check (username is null or char_length(username) >= 3)
);

-- Case-insensitive uniqueness without depending on the citext extension.
create unique index users_username_lower_key on public.users (lower(username));

comment on table public.users is
  'Profile mirror of auth.users, one row per user, created by handle_new_user().';

-- ---------------------------------------------------------------------------
-- isq_responses: append-only log. One row per submission, never updated or
-- deleted, so a retake preserves the prior answers for historical analysis.
-- ---------------------------------------------------------------------------
create table public.isq_responses (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  answers      jsonb       not null,
  total_score  integer     not null check (total_score between 0 and 100),
  band         text        not null check (band in ('Low', 'Medium', 'High')),
  submitted_at timestamptz not null default now()
);

create index isq_responses_user_submitted_idx
  on public.isq_responses (user_id, submitted_at desc);

comment on table public.isq_responses is
  'Append-only history of ISQ submissions. No UPDATE policy by design.';

-- ---------------------------------------------------------------------------
-- risk_profiles: the CURRENT profile, one row per user, upserted on retake.
-- Single source of truth for downstream recommendation features.
-- ---------------------------------------------------------------------------
create table public.risk_profiles (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null unique references auth.users (id) on delete cascade,
  isq_response_id uuid        not null references public.isq_responses (id) on delete cascade,
  band            text        not null check (band in ('Low', 'Medium', 'High')),
  score           integer     not null check (score between 0 and 100),
  computed_at     timestamptz not null default now()
);

comment on table public.risk_profiles is
  'Current risk profile per user. Upserted on every ISQ retake; supersedes prior results.';

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Creates the profile row from the metadata passed at signUp.
-- SECURITY DEFINER is required (it writes across schemas), so search_path is
-- pinned empty and EXECUTE is revoked from every client role below.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, username, contact, occupation)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'contact'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'occupation'), '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security. Every policy pairs `TO authenticated` with an ownership
-- predicate: `TO authenticated` alone is authentication without authorization.
-- ---------------------------------------------------------------------------
alter table public.users         enable row level security;
alter table public.isq_responses enable row level security;
alter table public.risk_profiles enable row level security;

-- users: read and update your own row. No INSERT policy -- rows come only from
-- the trigger. No DELETE policy -- removal cascades from auth.users.
create policy users_select_own on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy users_update_own on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- isq_responses: SELECT + INSERT only. The absence of an UPDATE policy is what
-- makes the history append-only at the database level, not by convention.
create policy isq_responses_select_own on public.isq_responses
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy isq_responses_insert_own on public.isq_responses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- risk_profiles: SELECT + INSERT + UPDATE (the retake upsert needs UPDATE).
-- UPDATE carries both USING and WITH CHECK so user_id cannot be reassigned.
create policy risk_profiles_select_own on public.risk_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy risk_profiles_insert_own on public.risk_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy risk_profiles_update_own on public.risk_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Data API grants. anon gets nothing at all on these tables; authenticated
-- gets exactly the verbs the policies above allow.
-- ---------------------------------------------------------------------------
revoke all on public.users         from anon;
revoke all on public.isq_responses from anon;
revoke all on public.risk_profiles from anon;

grant select, update         on public.users         to authenticated;
grant select, insert         on public.isq_responses to authenticated;
grant select, insert, update on public.risk_profiles to authenticated;
