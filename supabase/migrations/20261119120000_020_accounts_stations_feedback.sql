-- Real accounts: each customer's primary pickup station, stations customers add themselves,
-- map positions for "nearest station", and in-app feedback.

-- 1. Station positions and customer-added stations ------------------------------------
alter table public.pickup_stations
  add column if not exists lat numeric check (lat between 3 and 15),
  add column if not exists lng numeric check (lng between 2 and 15),
  add column if not exists verified boolean not null default true,
  add column if not exists added_by uuid references auth.users (id) on delete set null;

grant select (lat, lng, verified) on public.pickup_stations to anon, authenticated;

-- Approximate positions for the starter stations (by area) so "nearest" works today.
update public.pickup_stations set lat = v.lat, lng = v.lng
from (values
  ('lag-ikeja-1', 6.6018, 3.3515), ('lag-ikeja-2', 6.5960, 3.3420), ('lag-lekki-1', 6.4474, 3.4723),
  ('lag-yaba-1', 6.5095, 3.3711), ('fct-wuse-1', 9.0765, 7.4683), ('riv-ph-1', 4.8156, 7.0498), ('oyo-ibadan-1', 7.3775, 3.9470)
) as v(id, lat, lng)
where pickup_stations.id = v.id and pickup_stations.lat is null;

-- Everyone sees verified stations; a customer also sees the ones they added; staff see all.
drop policy if exists "stations: anyone reads active" on public.pickup_stations;
create policy "stations: anyone reads verified, owners read their own"
  on public.pickup_stations for select
  using ((active and verified) or added_by = (select auth.uid()) or public.is_staff());

-- 2. Primary station on the profile ------------------------------------------------------
alter table public.profiles
  add column if not exists station_id text references public.pickup_stations (id) on delete set null;
grant select (station_id) on public.profiles to authenticated;

-- Pick a station as your primary delivery location.
create or replace function public.set_my_station(p_station text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists (
    select 1 from public.pickup_stations
    where id = p_station and active and (verified or added_by = auth.uid())
  ) then raise exception 'Unknown pickup station'; end if;
  update public.profiles set station_id = p_station where id = auth.uid();
end $$;

-- Add the Jumia station you use when it isn't listed yet. Staff check it before the first dispatch.
create or replace function public.add_my_station(p_state text, p_area text, p_name text, p_address text, p_lat numeric default null, p_lng numeric default null)
returns text language plpgsql security definer set search_path = '' as $$
declare new_id text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if length(coalesce(trim(p_state), '')) < 2 or length(coalesce(trim(p_area), '')) < 2 then raise exception 'Enter the state and area'; end if;
  if length(coalesce(trim(p_name), '')) < 3 or length(p_name) > 120 then raise exception 'Enter the station name as Jumia shows it'; end if;
  if length(coalesce(p_address, '')) > 300 then raise exception 'Address is too long'; end if;
  if (select count(*) from public.pickup_stations where added_by = auth.uid()) >= 3 then
    raise exception 'You can add up to 3 stations. Pick one you added, or contact us.';
  end if;
  new_id := 'u-' || substr(md5(gen_random_uuid()::text), 1, 10);
  insert into public.pickup_stations (id, state, area, name, address, hours, active, verified, added_by, sort, lat, lng)
  values (new_id, trim(p_state), trim(p_area), trim(p_name), nullif(trim(p_address), ''), null, true, false, auth.uid(), 1000,
          case when p_lat between 3 and 15 then p_lat end, case when p_lng between 2 and 15 then p_lng end);
  update public.profiles set station_id = new_id where id = auth.uid();
  return new_id;
end $$;

revoke execute on function public.set_my_station(text), public.add_my_station(text, text, text, text, numeric, numeric) from public, anon;
grant execute on function public.set_my_station(text), public.add_my_station(text, text, text, text, numeric, numeric) to authenticated;

-- 3. Feedback ----------------------------------------------------------------------------
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  customer_id uuid references auth.users (id) on delete set null,
  rating int check (rating between 1 and 5),
  message text check (length(message) <= 2000),
  page text,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create policy "feedback: staff read" on public.feedback for select using (public.is_staff());
grant select on public.feedback to authenticated;
comment on table public.feedback is 'Settings → Rating & feedback. Written by the server (service role) after a rate limit.';

-- 4. Seed rows are real now: the comment on stations explains the starter rows.
comment on table public.pickup_stations is
  'Jumia pickup stations. verified=false rows were added by customers and need a staff check before dispatch.';
