-- DRAFT, NOT APPLIED (2026-10-02). Developer-only social features, parked in V1_SCOPE_PLAN.md.
-- Move into supabase/migrations/ with a fresh timestamp when Carlos schedules it.

-- Papaldo v0.6 (Carlos, 2026-10-02): profile personalization, chat avatars and
-- "who's active". These features are behind the Developer role for now
-- (Carlos is deciding what goes into v1): the app shows them to admins only,
-- and active_members() refuses everyone else in the database as well.

-- 1. Profile personalization. Owners can update every column of their own row
--    (users RLS), so every value is checked here, not only in the app.
alter table public.users
  add column facebook_url text
    check (facebook_url is null or (char_length(facebook_url) <= 200
      and facebook_url ~* '^https://(www\.|m\.|web\.)?facebook\.com/[A-Za-z0-9._/?=&%-]+$')),
  add column website_title text
    check (website_title is null or char_length(btrim(website_title)) between 1 and 40),
  add column banner_url text
    check (banner_url is null or (char_length(banner_url) <= 500
      and banner_url ~ '^https://res\.cloudinary\.com/[A-Za-z0-9_-]+/image/upload/')),
  add column profile_palette text
    check (profile_palette is null or profile_palette in ('midnight', 'forest', 'orchid', 'black', 'white', 'custom')),
  add column profile_colors jsonb
    check (profile_colors is null or (jsonb_typeof(profile_colors) = 'object'
      and (profile_colors ->> 'primary') ~ '^#[0-9A-Fa-f]{6}$'
      and (profile_colors ->> 'secondary') ~ '^#[0-9A-Fa-f]{6}$')),
  add column last_active_at timestamptz;

comment on column public.users.facebook_url is 'Optional Facebook profile link, shown as a badge on the member profile (rendered nofollow ugc).';
comment on column public.users.website_title is 'Optional label for the website badge ("View my website" when empty).';
comment on column public.users.banner_url is 'Profile banner on Cloudinary (res.cloudinary.com only), set by /api/profile/banner.';
comment on column public.users.profile_palette is 'The palette the owner picked in Settings; their member profile is drawn in it.';
comment on column public.users.profile_colors is 'Custom palette colours {primary, secondary} when profile_palette = custom.';
comment on column public.users.last_active_at is 'Last heartbeat from a signed-in tab (at most once a minute); powers "active now".';

create index users_last_active_idx on public.users (last_active_at desc) where last_active_at is not null;

-- 2. Chat avatars: a snapshot taken when the message is posted, like
--    author_name, because users RLS keeps other people's rows unreadable.
alter table public.chat_messages
  add column author_avatar_url text;
grant select (author_avatar_url) on public.chat_messages to anon, authenticated;

update public.chat_messages m
set author_avatar_url = u.avatar_url
from public.users u
where m.user_id = u.id and not m.is_guest and u.avatar_url is not null;

create or replace function private.chat_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  guest_name text;
begin
  if new.is_guest then
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
    new.author_name := guest_name;
    new.author_avatar_url := null;
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
  select coalesce(u.username, 'Investor'), u.avatar_url
    into new.author_name, new.author_avatar_url
  from public.users u where u.id = new.user_id;
  new.author_name := coalesce(new.author_name, 'Investor');
  return new;
end;
$function$;

-- 3. Who is active: signed-in members seen in the last five minutes.
--    Developers only while the feature is unreleased.
create or replace function public.active_members(p_limit integer default 40)
returns table (username text, avatar_url text, is_friend boolean, is_self boolean)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null or not private.is_admin() then
    raise exception 'Not available yet.' using errcode = '42501';
  end if;
  return query
  select u.username, u.avatar_url,
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and least(f.requester_id, f.addressee_id) = least(viewer, u.id)
        and greatest(f.requester_id, f.addressee_id) = greatest(viewer, u.id)
    ),
    u.id = viewer
  from public.users u
  where u.last_active_at > now() - interval '5 minutes' and u.username is not null
  order by u.last_active_at desc
  limit least(greatest(coalesce(p_limit, 40), 1), 100);
end;
$function$;

revoke all on function public.active_members(integer) from public, anon;
grant execute on function public.active_members(integer) to authenticated;

-- 4. The member profile carries the new fields (still never email, contact or income).
create or replace function public.public_profile(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
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

  return jsonb_build_object(
    'username', u.username,
    'avatar_url', u.avatar_url,
    'website', u.website,
    'website_title', u.website_title,
    'facebook_url', u.facebook_url,
    'banner_url', u.banner_url,
    'profile_palette', u.profile_palette,
    'profile_colors', u.profile_colors,
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
$function$;

-- 5. Banner uploads are logged like avatars (integration_logs target 'cloudinary', already allowed).
