-- Papaldo v0.5: profile picture, website, up to three occupations, and a
-- Private switch (Carlos, 2026-09-30).
--
-- Owners may update every column of their own users row (table-wide UPDATE
-- grant, 20260828134500), so the rules for the new columns are CHECK
-- constraints: the server route validates too, but only the database cannot
-- be skipped.
--
-- occupations replaces occupation in two steps. This migration adds and
-- backfills it, and handle_new_user writes both; the app writes both while it
-- moves over. A later migration drops occupation once nothing reads it.

-- Every entry 1-80 characters (CHECK constraints cannot hold a subquery, so it
-- lives in a small immutable helper).
create or replace function private.text_items_within(items text[], max_length int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(char_length(item) between 1 and max_length), true) from unnest(items) as item
$$;
-- A CHECK runs as whoever writes the row, so signed-in users need EXECUTE.
revoke all on function private.text_items_within(text[], int) from public;
grant execute on function private.text_items_within(text[], int) to authenticated;

alter table public.users
  add column avatar_url text
    check (avatar_url is null or (char_length(avatar_url) <= 500 and avatar_url ~ '^https://res\.cloudinary\.com/[A-Za-z0-9_-]+/image/upload/')),
  add column website text
    check (website is null or (char_length(website) <= 200 and website ~* '^https?://[^[:space:]]+$')),
  add column occupations text[] not null default '{}'
    check (cardinality(occupations) <= 3 and private.text_items_within(occupations, 80)),
  add column is_private boolean not null default false;

comment on column public.users.avatar_url is 'Profile picture on Cloudinary (res.cloudinary.com only), set by /api/profile/avatar.';
comment on column public.users.website is 'Optional link shown on the public profile (http/https, rendered nofollow ugc).';
comment on column public.users.occupations is 'Up to three occupations. Supersedes occupation, which is dropped once the app has moved over.';
comment on column public.users.is_private is 'Hides balance, holdings and risk band from everyone except friends.';

update public.users
set occupations = array[btrim(occupation)]
where occupation is not null and btrim(occupation) <> '';

-- Sign-up keeps writing occupation too until it is dropped.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_occupation text := nullif(trim(new.raw_user_meta_data ->> 'occupation'), '');
begin
  insert into public.users (id, email, username, contact, occupation, occupations)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'contact'), ''),
    first_occupation,
    case when first_occupation is null then '{}'::text[] else array[first_occupation] end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
