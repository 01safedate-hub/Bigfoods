-- Roles and profiles -------------------------------------------------------
create type public.app_role as enum (
  'customer', 'seller', 'super_admin', 'finance', 'purchasing', 'warehouse', 'customer_care', 'marketing'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user. role drives staff access; customers default to customer.';

-- Is the current user one of these roles? Used by RLS policies.
create or replace function public.has_role(roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = any (roles)
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['super_admin','finance','purchasing','warehouse','customer_care','marketing']::public.app_role[]);
$$;

-- Create a profile when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only a super admin may change anyone's role (including their own).
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.has_role(array['super_admin']::public.app_role[]) then
    raise exception 'Only a super admin can change roles';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

alter table public.profiles enable row level security;

create policy "Users read their own profile; staff read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());

create policy "Users update their own profile; super admins update any"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.has_role(array['super_admin']::public.app_role[]))
  with check (id = (select auth.uid()) or public.has_role(array['super_admin']::public.app_role[]));

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_role() from public, anon, authenticated;
