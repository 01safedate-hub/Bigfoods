create extension if not exists pg_net with schema extensions;

-- Tokens the database uses to call our own edge functions (scheduled jobs). Never exposed through the API.
create table public.internal_tokens (
  name text primary key,
  token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now()
);
alter table public.internal_tokens enable row level security;
revoke all on public.internal_tokens from anon, authenticated;
comment on table public.internal_tokens is 'Server-only. Edge functions check x-task-token against this table with the service role.';

insert into public.internal_tokens (name) values ('tasks');
