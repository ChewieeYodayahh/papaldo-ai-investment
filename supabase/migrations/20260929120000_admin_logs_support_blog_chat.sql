-- Developer dashboard, support, blog and the community chat room (2026-09-29).
--
-- Security model. The Next app has no service-role key, and gets none here:
--   * roles live in their own table that no client role can write
--     (public.users is updatable column-wide by its owner, so a role column
--     there would be self-grantable);
--   * the audit log is written only by triggers on the tables it describes;
--   * integration/notification logs and support messages are written through
--     SECURITY DEFINER functions that validate every argument;
--   * everything an admin reads is gated by private.is_admin(), which lives in
--     a schema the Data API does not expose.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ─── Roles ──────────────────────────────────────────────────────────────────

create table public.user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create policy user_roles_select_own_or_admin on public.user_roles
  for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));

insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where lower(email) = 'sirstephenshockwave@gmail.com'
on conflict (user_id) do nothing;

-- ─── Audit log (trigger-written) ────────────────────────────────────────────

create table public.audit_log (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id    uuid references auth.users (id) on delete set null,
  actor_role  text not null default 'user' check (actor_role in ('user', 'admin', 'system')),
  action      text not null check (char_length(action) between 1 and 80),
  entity      text not null check (char_length(entity) between 1 and 40),
  entity_id   text check (char_length(entity_id) <= 80),
  note        text check (char_length(note) <= 500),
  details     jsonb not null default '{}'::jsonb
);
create index audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
create index audit_log_actor_id_idx on public.audit_log (actor_id);
create index audit_log_action_idx on public.audit_log (action);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
create policy audit_log_admin_read on public.audit_log
  for select to authenticated using ((select private.is_admin()));

create or replace function private.write_audit(
  p_action text, p_entity text, p_entity_id text, p_note text default null, p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id, note, details)
  values (
    uid,
    case
      when uid is null then 'system'
      when exists (select 1 from public.user_roles r where r.user_id = uid and r.role = 'admin') then 'admin'
      else 'user'
    end,
    p_action, p_entity, left(p_entity_id, 80), left(p_note, 500), coalesce(p_details, '{}'::jsonb)
  );
end;
$$;
revoke all on function private.write_audit(text, text, text, text, jsonb) from public;

-- ─── Integration log ────────────────────────────────────────────────────────

create table public.integration_logs (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  source      text not null default 'papaldo-web' check (char_length(source) <= 40),
  target      text not null check (target in ('alpaca', 'finnhub', 'exchange-rate', 'claude', 'supabase-auth', 'yahoo', 'stooq')),
  action      text not null check (char_length(action) between 1 and 80),
  status      text not null check (status in ('success', 'error')),
  duration_ms integer check (duration_ms between 0 and 600000),
  http_status integer check (http_status between 0 and 599),
  tx_id       text not null default substr(md5(gen_random_uuid()::text), 1, 8),
  actor_id    uuid references auth.users (id) on delete set null,
  error       text check (char_length(error) <= 500)
);
create index integration_logs_occurred_at_idx on public.integration_logs (occurred_at desc);
create index integration_logs_target_idx on public.integration_logs (target, occurred_at desc);
create index integration_logs_errors_idx on public.integration_logs (occurred_at desc) where status = 'error';
create index integration_logs_actor_id_idx on public.integration_logs (actor_id);
alter table public.integration_logs enable row level security;
revoke all on public.integration_logs from anon, authenticated;
grant select on public.integration_logs to authenticated;
create policy integration_logs_admin_read on public.integration_logs
  for select to authenticated using ((select private.is_admin()));

-- Called by the web app's server code after each external API call. Anyone
-- may call it, so every argument is bounded; rows older than 30 days are
-- trimmed now and then instead of needing a cron.
create or replace function public.log_integration(
  p_target text, p_action text, p_status text,
  p_duration_ms integer default null, p_http_status integer default null, p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.integration_logs (target, action, status, duration_ms, http_status, actor_id, error)
  values (p_target, left(p_action, 80), p_status, p_duration_ms, p_http_status, auth.uid(), left(p_error, 500));
  if random() < 0.01 then
    delete from public.integration_logs where occurred_at < now() - interval '30 days';
  end if;
end;
$$;
revoke all on function public.log_integration(text, text, text, integer, integer, text) from public;
grant execute on function public.log_integration(text, text, text, integer, integer, text) to anon, authenticated;

-- ─── Notification log ───────────────────────────────────────────────────────

create table public.notification_log (
  id           bigint generated always as identity primary key,
  occurred_at  timestamptz not null default now(),
  channel      text not null check (channel in ('in_app', 'email')),
  event        text not null check (char_length(event) between 1 and 80),
  recipient_id uuid references auth.users (id) on delete set null,
  recipient    text check (char_length(recipient) <= 254),
  status       text not null check (status in ('sent', 'skipped', 'failed')),
  error        text check (char_length(error) <= 500),
  details      jsonb not null default '{}'::jsonb
);
create index notification_log_occurred_at_idx on public.notification_log (occurred_at desc);
create index notification_log_recipient_id_idx on public.notification_log (recipient_id);
alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;
grant select on public.notification_log to authenticated;
create policy notification_log_admin_read on public.notification_log
  for select to authenticated using ((select private.is_admin()));

-- For notifications the server sends on the caller's behalf (e.g. the
-- password-change confirmation email). The recipient is always the caller.
create or replace function public.log_notification(
  p_channel text, p_event text, p_status text, p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  insert into public.notification_log (channel, event, recipient_id, recipient, status, error)
  select p_channel, left(p_event, 80), uid, u.email, p_status, left(p_error, 500)
  from public.users u where u.id = uid;
end;
$$;
revoke all on function public.log_notification(text, text, text, text) from public;
grant execute on function public.log_notification(text, text, text, text) to authenticated;

-- ─── Support messages ───────────────────────────────────────────────────────

create table public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null unique default ('PPK-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  user_id     uuid references auth.users (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 80),
  email       text not null check (char_length(email) between 3 and 254 and position('@' in email) > 1),
  subject     text not null check (char_length(subject) between 1 and 120),
  body        text not null check (char_length(body) between 10 and 5000),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null
);
create index support_messages_status_idx on public.support_messages (status, created_at desc);
create index support_messages_user_id_idx on public.support_messages (user_id);
create index support_messages_email_idx on public.support_messages (lower(email), created_at desc);
alter table public.support_messages enable row level security;
revoke all on public.support_messages from anon, authenticated;
grant select on public.support_messages to authenticated;
grant update (status, resolved_at, resolved_by) on public.support_messages to authenticated;
create policy support_messages_read on public.support_messages
  for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy support_messages_admin_update on public.support_messages
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- The only way in. Guests may write too; three messages per ten minutes per
-- email address keeps the form from becoming a spam pipe.
create or replace function public.submit_support_message(
  p_name text, p_email text, p_subject text, p_body text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_ref text;
begin
  if (
    select count(*) from public.support_messages
    where lower(email) = lower(btrim(p_email)) and created_at > now() - interval '10 minutes'
  ) >= 3 then
    raise exception 'Too many messages. Wait a few minutes and try again.' using errcode = 'P0001';
  end if;

  insert into public.support_messages (user_id, name, email, subject, body)
  values (auth.uid(), btrim(p_name), btrim(p_email), btrim(p_subject), btrim(p_body))
  returning ref into new_ref;
  return new_ref;
end;
$$;
revoke all on function public.submit_support_message(text, text, text, text) from public;
grant execute on function public.submit_support_message(text, text, text, text) to anon, authenticated;

-- ─── Blog ───────────────────────────────────────────────────────────────────

create table public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title        text not null check (char_length(title) between 1 and 140),
  excerpt      text not null default '' check (char_length(excerpt) <= 300),
  body         text not null check (char_length(body) between 1 and 50000),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  author_id    uuid references auth.users (id) on delete set null default auth.uid(),
  author_name  text not null default 'Papaldo team' check (char_length(author_name) <= 80),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index blog_posts_published_idx on public.blog_posts (published_at desc) where status = 'published';
create index blog_posts_author_id_idx on public.blog_posts (author_id);
alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
create policy blog_posts_read_published on public.blog_posts
  for select to anon, authenticated using (status = 'published');
create policy blog_posts_admin_read on public.blog_posts
  for select to authenticated using ((select private.is_admin()));
create policy blog_posts_admin_insert on public.blog_posts
  for insert to authenticated with check ((select private.is_admin()));
create policy blog_posts_admin_update on public.blog_posts
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy blog_posts_admin_delete on public.blog_posts
  for delete to authenticated using ((select private.is_admin()));

create or replace function private.blog_posts_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
    new.author_name := coalesce(
      (select u.username from public.users u where u.id = auth.uid()),
      'Papaldo team'
    );
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;
create trigger blog_posts_before_write
  before insert or update on public.blog_posts
  for each row execute function private.blog_posts_before_write();

-- ─── Community chat (one room) ──────────────────────────────────────────────

create table public.chat_messages (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null default 'Investor' check (char_length(author_name) <= 80),
  body        text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at  timestamptz not null default now(),
  removed_at  timestamptz,
  removed_by  uuid references auth.users (id) on delete set null
);
create index chat_messages_visible_idx on public.chat_messages (id desc) where removed_at is null;
create index chat_messages_user_id_idx on public.chat_messages (user_id, created_at desc);
alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;
-- Guests read the room without seeing account ids.
grant select (id, author_name, body, created_at, removed_at) on public.chat_messages to anon;
grant select on public.chat_messages to authenticated;
grant insert (body) on public.chat_messages to authenticated;
grant update (removed_at, removed_by) on public.chat_messages to authenticated;
-- Two policies: guests cannot execute private.is_admin().
create policy chat_messages_read_guest on public.chat_messages
  for select to anon using (removed_at is null);
create policy chat_messages_read on public.chat_messages
  for select to authenticated using (removed_at is null or (select private.is_admin()));
create policy chat_messages_insert_own on public.chat_messages
  for insert to authenticated
  with check ((select auth.uid()) = user_id and removed_at is null and removed_by is null);
create policy chat_messages_admin_moderate on public.chat_messages
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Stamps the sender's username and slows down floods: one message every two
-- seconds, twenty a minute.
create or replace function private.chat_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
create trigger chat_messages_before_insert
  before insert on public.chat_messages
  for each row execute function private.chat_messages_before_insert();

-- ─── Audit and notification triggers ───────────────────────────────────────

create or replace function private.audit_orders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select p.user_id into owner from public.portfolios p where p.id = new.portfolio_id;
  perform private.write_audit(
    'order.filled', 'order', new.id::text, null,
    jsonb_build_object('symbol', new.symbol, 'side', new.side, 'quantity', new.quantity, 'fill_price', new.fill_price)
  );
  insert into public.notification_log (channel, event, recipient_id, status, details)
  values ('in_app', 'order.filled', owner, 'sent',
          jsonb_build_object('symbol', new.symbol, 'side', new.side, 'quantity', new.quantity));
  return new;
end;
$$;
create trigger audit_orders after insert on public.orders
  for each row execute function private.audit_orders();

create or replace function private.audit_risk_profiles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.write_audit('risk_profile.created', 'risk_profile', new.id::text, null,
    jsonb_build_object('band', new.band, 'score', new.score));
  return new;
end;
$$;
create trigger audit_risk_profiles after insert on public.risk_profiles
  for each row execute function private.audit_risk_profiles();

-- Records which profile fields changed, never their values.
create or replace function private.audit_users()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed text[];
begin
  if tg_op = 'INSERT' then
    perform private.write_audit('account.created', 'user', new.id::text);
    return new;
  end if;
  select array_agg(key order by key) into changed
  from jsonb_each(to_jsonb(new)) n
  where key not in ('updated_at') and n.value is distinct from (to_jsonb(old) -> key);
  if changed is not null then
    perform private.write_audit('profile.updated', 'user', new.id::text,
      'Changed: ' || array_to_string(changed, ', '));
  end if;
  return new;
end;
$$;
create trigger audit_users after insert or update on public.users
  for each row execute function private.audit_users();

create or replace function private.audit_user_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit('role.granted', 'user', new.user_id::text, new.role);
    return new;
  end if;
  perform private.write_audit('role.revoked', 'user', old.user_id::text, old.role);
  return old;
end;
$$;
create trigger audit_user_roles after insert or delete on public.user_roles
  for each row execute function private.audit_user_roles();

create or replace function private.audit_support_messages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit('support.created', 'support', new.ref, left(new.subject, 120));
    insert into public.notification_log (channel, event, recipient, status, details)
    values ('in_app', 'support.received', 'admins', 'sent', jsonb_build_object('ref', new.ref));
  elsif new.status is distinct from old.status then
    perform private.write_audit('support.' || new.status, 'support', new.ref);
  end if;
  return new;
end;
$$;
create trigger audit_support_messages after insert or update on public.support_messages
  for each row execute function private.audit_support_messages();

create or replace function private.audit_blog_posts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit('blog.created', 'blog_post', new.slug, new.title);
    return new;
  elsif tg_op = 'DELETE' then
    perform private.write_audit('blog.deleted', 'blog_post', old.slug, old.title);
    return old;
  end if;
  perform private.write_audit(
    case when new.status = 'published' and old.status <> 'published' then 'blog.published' else 'blog.updated' end,
    'blog_post', new.slug, new.title);
  return new;
end;
$$;
create trigger audit_blog_posts after insert or update or delete on public.blog_posts
  for each row execute function private.audit_blog_posts();

create or replace function private.audit_chat_messages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.removed_at is not null and old.removed_at is null then
    perform private.write_audit('chat.message_removed', 'chat_message', new.id::text, left(old.body, 120));
  end if;
  return new;
end;
$$;
create trigger audit_chat_messages after update on public.chat_messages
  for each row execute function private.audit_chat_messages();

revoke all on all functions in schema private from public;
grant execute on function private.is_admin() to authenticated;

-- ─── Admin read models ──────────────────────────────────────────────────────

-- Accounts with their sign-in activity, band and trading counts. auth.users
-- is not readable through the Data API, hence a definer function.
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, username text, created_at timestamptz, last_sign_in_at timestamptz,
  is_admin boolean, band text, orders bigint, providers text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return query
  select
    a.id, a.email::text, u.username, a.created_at, a.last_sign_in_at,
    exists (select 1 from public.user_roles r where r.user_id = a.id and r.role = 'admin'),
    (select rp.band from public.risk_profiles rp where rp.user_id = a.id order by rp.computed_at desc limit 1),
    (select count(*) from public.orders o join public.portfolios p on p.id = o.portfolio_id where p.user_id = a.id),
    coalesce(array(select jsonb_array_elements_text(a.raw_app_meta_data -> 'providers')), '{}')
  from auth.users a
  left join public.users u on u.id = a.id
  order by a.created_at desc;
end;
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_set_role(p_user_id uuid, p_make_admin boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() and not p_make_admin then
    raise exception 'You cannot remove your own admin role' using errcode = '42501';
  end if;
  if p_make_admin then
    insert into public.user_roles (user_id, role, granted_by) values (p_user_id, 'admin', auth.uid())
    on conflict (user_id) do nothing;
  else
    delete from public.user_roles where user_id = p_user_id;
  end if;
end;
$$;
revoke all on function public.admin_set_role(uuid, boolean) from public, anon;
grant execute on function public.admin_set_role(uuid, boolean) to authenticated;

-- Everything the Overview and Resources pages count, in one round trip.
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'users', (select count(*) from auth.users),
    'users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'signed_in_24h', (select count(*) from auth.users where last_sign_in_at > now() - interval '24 hours'),
    'with_risk_profile', (select count(distinct user_id) from public.risk_profiles),
    'bands', (select coalesce(jsonb_object_agg(band, n), '{}') from (
        select band, count(*) n from (
          select distinct on (user_id) user_id, band from public.risk_profiles order by user_id, computed_at desc
        ) latest group by band) b),
    'orders', (select count(*) from public.orders),
    'orders_24h', (select count(*) from public.orders where created_at > now() - interval '24 hours'),
    'orders_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'orders', coalesce(n, 0)) order by d), '[]')
        from generate_series(current_date - 13, current_date, interval '1 day') d
        left join (select created_at::date as order_day, count(*) as n from public.orders group by 1) o on o.order_day = d::date),
    'support_open', (select count(*) from public.support_messages where status = 'open'),
    'blog_published', (select count(*) from public.blog_posts where status = 'published'),
    'blog_drafts', (select count(*) from public.blog_posts where status = 'draft'),
    'chat_24h', (select count(*) from public.chat_messages where created_at > now() - interval '24 hours'),
    'integration_24h', (select count(*) from public.integration_logs where occurred_at > now() - interval '24 hours'),
    'integration_errors_24h', (select count(*) from public.integration_logs where status = 'error' and occurred_at > now() - interval '24 hours'),
    'integration_by_target_24h', (select coalesce(jsonb_object_agg(target, jsonb_build_object('calls', calls, 'errors', errors, 'avg_ms', avg_ms)), '{}') from (
        select target, count(*) calls, count(*) filter (where status = 'error') errors, round(avg(duration_ms))::int avg_ms
        from public.integration_logs where occurred_at > now() - interval '24 hours' group by target) t),
    'integration_by_hour', (select coalesce(jsonb_agg(jsonb_build_object('hour', h, 'calls', coalesce(calls, 0), 'errors', coalesce(errors, 0)) order by h), '[]')
        from generate_series(date_trunc('hour', now()) - interval '23 hours', date_trunc('hour', now()), interval '1 hour') h
        left join (select date_trunc('hour', occurred_at) hr, count(*) calls, count(*) filter (where status = 'error') errors
                   from public.integration_logs where occurred_at > now() - interval '24 hours' group by 1) i on i.hr = h),
    'notifications_24h', (select count(*) from public.notification_log where occurred_at > now() - interval '24 hours'),
    'notifications_failed_24h', (select count(*) from public.notification_log where status = 'failed' and occurred_at > now() - interval '24 hours'),
    'audit_24h', (select count(*) from public.audit_log where occurred_at > now() - interval '24 hours'),
    'database_bytes', pg_database_size(current_database()),
    'tables', (select coalesce(jsonb_agg(jsonb_build_object('name', s.relname, 'rows', s.n_live_tup, 'bytes', pg_total_relation_size(s.relid)) order by pg_total_relation_size(s.relid) desc), '[]')
        from pg_stat_user_tables s where s.schemaname = 'public'),
    'benchmarks_as_of', (select max(price_date) from public.market_benchmarks),
    'market_caps_as_of', (select max(market_cap_as_of) from public.tradable_assets)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
