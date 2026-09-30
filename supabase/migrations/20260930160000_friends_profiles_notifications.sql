-- Papaldo v0.5: friends, public profiles and friend notifications
-- (Carlos, 2026-09-30).
--
--   friendships    one row per pair; written only by the functions below, so a
--                  requester can never insert "accepted". The app addresses
--                  people by username and lists them through my_friends(),
--                  since users RLS hides everyone else's row.
--   notifications  the header bell's inbox for social events. actor_name is a
--                  snapshot because users RLS stops the bell from joining
--                  another person's row.
--   public_profile what a signed-in viewer may see of someone: never id, email,
--                  contact or income; balance, holdings and band only when the
--                  profile is public, or for friends and oneself.

-- ─── Friendships ────────────────────────────────────────────────────────────

create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users (id) on delete cascade,
  addressee_id  uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  constraint friendships_not_self check (requester_id <> addressee_id)
);
create unique index friendships_pair_key
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id, status);
create index friendships_requester_idx on public.friendships (requester_id, created_at desc);
alter table public.friendships enable row level security;
revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;
create policy friendships_read_own on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- ─── Notifications inbox ────────────────────────────────────────────────────

-- actor_id is for the rate limits below and is not granted to anyone: the
-- inbox shows the name, never the other person's id.
create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  actor_id    uuid references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('friend_request', 'friend_accepted')),
  actor_name  text not null check (char_length(actor_name) between 1 and 80),
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index notifications_user_recent_idx on public.notifications (user_id, created_at desc);
create index notifications_actor_recent_idx on public.notifications (actor_id, created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select (id, user_id, kind, actor_name, created_at, read_at) on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_read_own on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notifications_mark_read_own on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ─── Helpers ────────────────────────────────────────────────────────────────

-- The caller's user row, or an error when signed out / without a username.
create or replace function private.require_member()
returns table (id uuid, username text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  return query select u.id, u.username from public.users u where u.id = auth.uid() and u.username is not null;
  if not found then
    raise exception 'Pick a username first.' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function private.require_member() from public;

-- ─── request_friend(username) ───────────────────────────────────────────────
-- Returns 'requested', 'accepted' (they had already asked you), 'pending'
-- (already asked) or 'friends'.
--
-- Limits count notifications, not friendships, because cancelling a request
-- deletes its row: 5 requests a minute per sender, and at most one request
-- notification to the same person a day, so request-cancel-request cannot
-- spam anyone's bell. A declined sender waits a day to ask again.

create or replace function public.request_friend(p_username text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me record;
  target record;
  existing public.friendships;
begin
  select * into me from private.require_member();
  select u.id, u.username into target from public.users u where lower(u.username) = lower(btrim(coalesce(p_username, '')));
  if target.id is null then
    raise exception 'No member goes by that name.' using errcode = 'P0001';
  end if;
  if target.id = me.id then
    raise exception 'That is you.' using errcode = 'P0001';
  end if;

  select * into existing from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(me.id, target.id)
    and greatest(f.requester_id, f.addressee_id) = greatest(me.id, target.id)
  for update;

  if existing.id is not null then
    if existing.status = 'accepted' then
      return 'friends';
    end if;
    if existing.status = 'pending' and existing.requester_id = me.id then
      return 'pending';
    end if;
    if existing.status = 'pending' and existing.requester_id = target.id then
      -- They asked first: asking back accepts.
      update public.friendships set status = 'accepted', responded_at = now() where id = existing.id;
      insert into public.notifications (user_id, actor_id, kind, actor_name)
      values (target.id, me.id, 'friend_accepted', me.username);
      return 'accepted';
    end if;
    -- Declined earlier: a new request may follow after a day.
    if existing.responded_at > now() - interval '24 hours' then
      raise exception 'Try again tomorrow.' using errcode = 'P0001';
    end if;
    delete from public.friendships where id = existing.id;
  end if;

  if (
    select count(*) from public.notifications n
    where n.actor_id = me.id and n.kind = 'friend_request' and n.created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'That is a lot of requests at once. Wait a minute.' using errcode = 'P0001';
  end if;

  begin
    insert into public.friendships (requester_id, addressee_id) values (me.id, target.id);
  exception when unique_violation then
    -- The other person asked at the same moment; their row stands.
    return 'pending';
  end;
  if not exists (
    select 1 from public.notifications n
    where n.actor_id = me.id and n.user_id = target.id and n.kind = 'friend_request'
      and n.created_at > now() - interval '24 hours'
  ) then
    insert into public.notifications (user_id, actor_id, kind, actor_name)
    values (target.id, me.id, 'friend_request', me.username);
  end if;
  return 'requested';
end;
$$;

-- ─── respond_friend(username, accept) ───────────────────────────────────────

create or replace function public.respond_friend(p_username text, p_accept boolean)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me record;
  request public.friendships;
begin
  select * into me from private.require_member();
  select f.* into request
  from public.friendships f
  join public.users u on u.id = f.requester_id
  where f.addressee_id = me.id and f.status = 'pending' and lower(u.username) = lower(btrim(coalesce(p_username, '')))
  for update of f;
  if request.id is null then
    raise exception 'That request is no longer open.' using errcode = 'P0001';
  end if;

  if p_accept then
    update public.friendships set status = 'accepted', responded_at = now() where id = request.id;
    insert into public.notifications (user_id, actor_id, kind, actor_name)
    values (request.requester_id, me.id, 'friend_accepted', me.username);
    return 'accepted';
  end if;
  update public.friendships set status = 'declined', responded_at = now() where id = request.id;
  return 'declined';
end;
$$;

-- ─── remove_friend(username): unfriend, or cancel your own pending request ──

create or replace function public.remove_friend(p_username text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me record;
  target_id uuid;
begin
  select * into me from private.require_member();
  select u.id into target_id from public.users u where lower(u.username) = lower(btrim(coalesce(p_username, '')));
  delete from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(me.id, target_id)
    and greatest(f.requester_id, f.addressee_id) = greatest(me.id, target_id)
    and (f.status = 'accepted' or (f.status = 'pending' and f.requester_id = me.id));
end;
$$;

-- ─── my_friends(): friends and open requests, by username ───────────────────

create or replace function public.my_friends()
returns table (username text, avatar_url text, relation text, since timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.username,
    u.avatar_url,
    case
      when f.status = 'accepted' then 'friends'
      when f.requester_id = (select auth.uid()) then 'outgoing'
      else 'incoming'
    end,
    coalesce(f.responded_at, f.created_at)
  from public.friendships f
  join public.users u
    on u.id = case when f.requester_id = (select auth.uid()) then f.addressee_id else f.requester_id end
  where (select auth.uid()) in (f.requester_id, f.addressee_id)
    and f.status in ('pending', 'accepted')
    and u.username is not null
  order by 3, u.username
$$;

-- ─── public_profile(username) ───────────────────────────────────────────────

create or replace function public.public_profile(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  u public.users;
  link public.friendships;
  relation text;
  visible boolean;
begin
  if viewer is null then
    raise exception 'Sign in to view profiles.' using errcode = '42501';
  end if;
  select * into u from public.users where lower(username) = lower(btrim(coalesce(p_username, '')));
  if u.id is null then
    return null;
  end if;

  select * into link from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(viewer, u.id)
    and greatest(f.requester_id, f.addressee_id) = greatest(viewer, u.id);
  relation := case
    when u.id = viewer then 'self'
    when link.status = 'accepted' then 'friends'
    when link.status = 'pending' and link.requester_id = viewer then 'outgoing'
    when link.status = 'pending' then 'incoming'
    else 'none'
  end;
  visible := not u.is_private or relation in ('self', 'friends');

  -- Built field by field (never to_jsonb(u.*)), so a new column can never leak.
  return jsonb_build_object(
    'username', u.username,
    'avatar_url', u.avatar_url,
    'website', u.website,
    'occupations', to_jsonb(u.occupations),
    'is_private', u.is_private,
    'relation', relation,
    'visible', visible,
    'band', case when visible then (select r.band from public.risk_profiles r where r.user_id = u.id) end,
    'cash', case when visible then (select p.cash_balance from public.portfolios p where p.user_id = u.id) end,
    'holdings', case when visible then coalesce((
      select jsonb_agg(jsonb_build_object('symbol', h.symbol, 'asset_class', h.asset_class, 'quantity', h.quantity) order by h.symbol)
      from public.holdings h join public.portfolios p on p.id = h.portfolio_id
      where p.user_id = u.id and h.quantity > 0
    ), '[]'::jsonb) end
  );
end;
$$;

comment on function public.public_profile(text) is
  'A member''s public profile for a signed-in viewer. Never returns id, email, contact or income; balance, holdings and band only if public, friends or self.';

-- ─── Grants: signed-in members only ─────────────────────────────────────────

revoke all on function public.request_friend(text) from public, anon, authenticated;
revoke all on function public.respond_friend(text, boolean) from public, anon, authenticated;
revoke all on function public.remove_friend(text) from public, anon, authenticated;
revoke all on function public.my_friends() from public, anon, authenticated;
revoke all on function public.public_profile(text) from public, anon, authenticated;
grant execute on function public.request_friend(text) to authenticated;
grant execute on function public.respond_friend(text, boolean) to authenticated;
grant execute on function public.remove_friend(text) to authenticated;
grant execute on function public.my_friends() to authenticated;
grant execute on function public.public_profile(text) to authenticated;
