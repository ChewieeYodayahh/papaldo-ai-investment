-- Papaldo v0.5: guests can chat under a temporary name (Carlos, 2026-09-30).
--
-- A guest picks a name and gets a guest pass: a random secret the browser keeps
-- in sessionStorage (gone when the tab or app closes) that expires ten minutes
-- after it is issued. Only the secret's sha256 is stored, so nobody who can
-- read the table -- no client role can -- could post as another guest.
--
-- Every check lives here, not in the Next route: the two functions are callable
-- with the public anon key directly, so the database is the only place a rule
-- can be enforced. What SQL cannot do is limit by IP; a Vercel firewall rule on
-- the guest routes covers that (EXTERNAL_SERVICES.md).

-- ─── Guest passes ───────────────────────────────────────────────────────────

create table public.guest_sessions (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  name        text not null check (name ~ '^[A-Za-z0-9 ]{2,24}$'),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '10 minutes'
);
create index guest_sessions_created_at_idx on public.guest_sessions (created_at);
alter table public.guest_sessions enable row level security;
-- No grants and no policies: only the SECURITY DEFINER functions below touch it.
revoke all on public.guest_sessions from anon, authenticated;

comment on table public.guest_sessions is
  'Ten-minute guest passes for the community chat. Holds a sha256 of the secret, never the secret.';

-- ─── Guest messages in the one chat room ───────────────────────────────────

alter table public.chat_messages alter column user_id drop not null;
alter table public.chat_messages add column is_guest boolean not null default false;
alter table public.chat_messages add column guest_session_id uuid;
alter table public.chat_messages add constraint chat_messages_one_author check (
  (is_guest and user_id is null and guest_session_id is not null)
  or (not is_guest and user_id is not null and guest_session_id is null)
);
create index chat_messages_guest_recent_idx on public.chat_messages (created_at) where is_guest;
create index chat_messages_guest_session_idx on public.chat_messages (guest_session_id, created_at) where is_guest;

-- Guests may see who is a guest; nobody may see guest_session_id. The
-- signed-in grant becomes a column list for that reason (it was table-wide).
grant select (is_guest) on public.chat_messages to anon;
revoke select on public.chat_messages from authenticated;
grant select (id, user_id, author_name, body, created_at, removed_at, removed_by, is_guest)
  on public.chat_messages to authenticated;

-- The signed-in path is unchanged (insert (body) only, so is_guest stays false
-- and user_id stays auth.uid()). Guest rows come only from post_guest_message.
create or replace function private.chat_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest_name text;
begin
  if new.is_guest then
    -- Lock the pass so two parallel posts cannot both slip under the limit.
    select s.name into guest_name
    from public.guest_sessions s
    where s.id = new.guest_session_id and s.expires_at > now()
    for update;
    if guest_name is null then
      raise exception 'Your guest pass has expired. Pick a name again.' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from public.chat_messages
      where is_guest and guest_session_id = new.guest_session_id and created_at > now() - interval '3 seconds'
    ) or (
      select count(*) from public.chat_messages
      where is_guest and guest_session_id = new.guest_session_id and created_at > now() - interval '1 minute'
    ) >= 10 then
      raise exception 'You are sending messages too fast. Wait a moment.' using errcode = 'P0001';
    end if;
    if (
      select count(*) from public.chat_messages
      where is_guest and created_at > now() - interval '1 minute'
    ) >= 60 then
      raise exception 'The room is busy with guests right now. Sign in, or try again in a minute.' using errcode = 'P0001';
    end if;
    new.body := btrim(new.body);
    if char_length(new.body) > 500 then
      raise exception 'Guest messages are up to 500 characters.' using errcode = 'P0001';
    end if;
    -- The name always comes from the pass, never from the caller.
    new.author_name := guest_name;
    return new;
  end if;

  if exists (
    select 1 from public.chat_messages
    where user_id = new.user_id and created_at > now() - interval '2 seconds'
  ) or (
    select count(*) from public.chat_messages
    where user_id = new.user_id and created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'You are sending messages too fast. Wait a moment.' using errcode = 'P0001';
  end if;
  new.body := btrim(new.body);
  new.author_name := coalesce((select u.username from public.users u where u.id = new.user_id), 'Investor');
  return new;
end;
$$;

-- ─── start_guest_session(name) -> secret ────────────────────────────────────

create or replace function public.start_guest_session(p_name text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  clean_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  secret text;
begin
  if auth.uid() is not null then
    raise exception 'You are signed in, so you chat with your account.' using errcode = 'P0001';
  end if;
  if clean_name !~ '^[A-Za-z0-9 ]{2,24}$' then
    raise exception 'Use 2 to 24 letters, numbers or spaces.' using errcode = 'P0001';
  end if;
  if lower(clean_name) ~ '(admin|papaldo|moderator|support|official|staff)' then
    raise exception 'That name is reserved. Pick another.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.users u where lower(u.username) = lower(clean_name)) then
    raise exception 'A member already uses that name. Pick another.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.guest_sessions where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Lots of new guests right now. Try again in a minute.' using errcode = 'P0001';
  end if;

  -- Tidy up now and then instead of needing a cron (same pattern as log_integration).
  if random() < 0.05 then
    delete from public.guest_sessions where expires_at < now() - interval '1 day';
  end if;

  secret := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.guest_sessions (token_hash, name)
  values (encode(sha256(convert_to(secret, 'UTF8')), 'hex'), clean_name);
  return secret;
end;
$$;

comment on function public.start_guest_session(text) is
  'Issues a ten-minute chat guest pass for a vetted name. Returns the secret once; stores only its sha256.';

revoke all on function public.start_guest_session(text) from public, anon, authenticated;
grant execute on function public.start_guest_session(text) to anon;

-- ─── post_guest_message(secret, body) -> message id ─────────────────────────

create or replace function public.post_guest_message(p_secret text, p_body text)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  session_id uuid;
  message_id bigint;
begin
  if auth.uid() is not null then
    raise exception 'You are signed in, so you chat with your account.' using errcode = 'P0001';
  end if;
  select s.id into session_id
  from public.guest_sessions s
  where s.token_hash = encode(sha256(convert_to(coalesce(p_secret, ''), 'UTF8')), 'hex')
    and s.expires_at > now();
  if session_id is null then
    raise exception 'Your guest pass has expired. Pick a name again.' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 500 then
    raise exception 'Guest messages are 1 to 500 characters.' using errcode = 'P0001';
  end if;

  insert into public.chat_messages (user_id, is_guest, guest_session_id, body)
  values (null, true, session_id, p_body)
  returning id into message_id;
  return message_id;
end;
$$;

comment on function public.post_guest_message(text, text) is
  'Posts to the community chat with a valid guest pass. Name and rate limits are applied by the insert trigger.';

revoke all on function public.post_guest_message(text, text) from public, anon, authenticated;
grant execute on function public.post_guest_message(text, text) to anon;
