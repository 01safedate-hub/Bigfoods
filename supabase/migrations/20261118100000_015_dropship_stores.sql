-- 015: dropship stores on fastchina.store.
-- Plans: free (20 products, Studio theme, name.fastchina.store, must upgrade after ₦2,000,000 lifetime sales),
--        pro ₦15,000/month (200 products, + Noir and Bloom themes, own domain),
--        elite ₦45,000/month (unlimited, all themes incl. Atelier and Pulse, own domain, lowest fee).
-- Sellers set a markup on top of FastChina's price and keep it; FastChina's price (and profit) is never reduced.
-- Earnings are paid weekly after delivery, minus a small fee (free 5%, pro 3%, elite 1.5%) that covers payment processing.

create function public.plan_rules(p_plan text)
returns table (max_products int, fee_pct numeric, themes text[], custom_domain boolean, price_ngn int)
language sql immutable set search_path = '' as $$
  select max_products, fee_pct, themes, custom_domain, price_ngn from (values
    ('free',  20,     5.0, array['studio'],                                  false, 0),
    ('pro',   200,    3.0, array['studio', 'noir', 'bloom'],                 true,  15000),
    ('elite', 100000, 1.5, array['studio', 'noir', 'bloom', 'atelier', 'pulse'], true, 45000)
  ) as t(plan, max_products, fee_pct, themes, custom_domain, price_ngn)
  where plan = p_plan
$$;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade default auth.uid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
  name text not null check (char_length(name) between 2 and 40),
  tagline text check (char_length(tagline) <= 90),
  accent text not null default '#111111' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  theme text not null default 'studio' check (theme in ('studio', 'noir', 'bloom', 'atelier', 'pulse')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'elite')),
  plan_renews_at timestamptz,
  custom_domain text unique check (custom_domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  domain_verified boolean not null default false,
  status text not null default 'active' check (status in ('active', 'needs_upgrade', 'suspended')),
  lifetime_sales_ngn bigint not null default 0,
  bank_name text check (char_length(bank_name) <= 60),
  account_number text check (account_number ~ '^[0-9]{10}$'),
  account_name text check (char_length(account_name) <= 80),
  created_at timestamptz not null default now()
);

create table public.store_products (
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  markup_type text not null default 'pct' check (markup_type in ('pct', 'fixed')),
  markup_value numeric not null default 20 check (markup_value >= 0),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  primary key (store_id, product_id),
  check (markup_type = 'fixed' and markup_value <= 5000000 or markup_type = 'pct' and markup_value <= 300)
);
create index store_products_store_idx on public.store_products (store_id, sort) where active;

-- Owner edits, plan rules and protected fields ---------------------------------------
create function public.stores_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r record; trusted boolean := coalesce(auth.role(), '') = 'service_role' or public.has_role(array['super_admin', 'marketing']::public.app_role[]);
begin
  new.slug := lower(new.slug);
  if new.slug in ('www', 'admin', 'api', 'app', 'store', 'shop', 'seller', 'sellers', 'mail', 'help', 'support', 'fastchina', 'static', 'assets') then
    raise exception 'That store address is reserved' using errcode = 'check_violation';
  end if;
  if tg_op = 'UPDATE' and not trusted and (new.plan is distinct from old.plan or new.plan_renews_at is distinct from old.plan_renews_at
      or new.status is distinct from old.status or new.lifetime_sales_ngn is distinct from old.lifetime_sales_ngn
      or new.domain_verified is distinct from old.domain_verified or new.owner_id is distinct from old.owner_id or new.slug is distinct from old.slug) then
    raise exception 'Only FastChina can change that' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'INSERT' and not trusted then
    new.plan := 'free'; new.status := 'active'; new.lifetime_sales_ngn := 0; new.domain_verified := false; new.plan_renews_at := null;
  end if;
  select * into r from public.plan_rules(new.plan);
  if not (new.theme = any (r.themes)) then
    raise exception 'The % theme needs a higher plan', initcap(new.theme) using errcode = 'check_violation';
  end if;
  if new.custom_domain is not null and not r.custom_domain then
    raise exception 'Your own domain needs the Pro or Elite plan' using errcode = 'check_violation';
  end if;
  if tg_op = 'UPDATE' and new.custom_domain is distinct from old.custom_domain then new.domain_verified := false; end if;
  return new;
end $$;
create trigger stores_guard before insert or update on public.stores for each row execute function public.stores_guard();

create function public.store_products_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare st public.stores; lim int; n int;
begin
  if not new.active then return new; end if;
  if tg_op = 'UPDATE' and old.active then return new; end if;
  select * into st from public.stores where id = new.store_id;
  select max_products into lim from public.plan_rules(st.plan);
  select count(*) into n from public.store_products where store_id = new.store_id and active and product_id <> new.product_id;
  if n >= lim then
    raise exception 'Your % plan allows % products. Upgrade to add more.', initcap(st.plan), lim using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger store_products_guard before insert or update on public.store_products for each row execute function public.store_products_guard();

-- Access -----------------------------------------------------------------------------
alter table public.stores enable row level security;
alter table public.store_products enable row level security;
create policy "stores: public storefronts" on public.stores for select using (status <> 'suspended' or owner_id = auth.uid() or public.is_staff());
create policy "stores: owner creates" on public.stores for insert with check (owner_id = auth.uid());
create policy "stores: owner edits" on public.stores for update using (owner_id = auth.uid() or public.is_staff()) with check (owner_id = auth.uid() or public.is_staff());
grant select (id, slug, name, tagline, accent, theme, plan, status, custom_domain, domain_verified, created_at) on public.stores to anon, authenticated;
grant select (owner_id, plan_renews_at, lifetime_sales_ngn, bank_name, account_number, account_name) on public.stores to authenticated;
grant insert (slug, name, tagline, accent, theme) on public.stores to authenticated;
grant update (name, tagline, accent, theme, custom_domain, bank_name, account_number, account_name) on public.stores to authenticated;
-- Bank details and sales are only for the owner: a second policy layer through a view is overkill here, so the
-- website reads them with the owner's session and RLS keeps other sellers out.

create policy "store products: public" on public.store_products for select using (
  active or exists (select 1 from public.stores s where s.id = store_id and (s.owner_id = auth.uid() or public.is_staff())));
create policy "store products: owner manages" on public.store_products for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
grant select on public.store_products to anon, authenticated;
grant insert, update, delete on public.store_products to authenticated;

-- Orders from stores -------------------------------------------------------------------
alter table public.orders add column store_id uuid references public.stores (id) on delete set null;
create index orders_store_idx on public.orders (store_id, created_at desc) where store_id is not null;
alter table public.order_items add column store_markup_ngn int not null default 0 check (store_markup_ngn >= 0);

create table public.seller_payouts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  amount_ngn int not null check (amount_ngn > 0),
  items int not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  reference text,
  bank_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.seller_payouts enable row level security;
create policy "payouts: owner or staff" on public.seller_payouts for select
  using (public.is_staff() or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
grant select on public.seller_payouts to authenticated;
alter table public.order_items add column payout_id uuid references public.seller_payouts (id);

-- Seller earnings per item: gross markup, fee by plan, net, and where it stands.
-- Internal view (server and jobs only). Sellers read the filtered view below: it never exposes buyer phone numbers.
create view public.store_earnings_all as
select o.store_id, o.id as order_id, o.code, o.status, o.created_at, o.paid_at, o.state, i.id as item_id, i.title, i.variant_label, i.qty,
  (i.store_markup_ngn * i.qty) as gross_ngn,
  round(i.store_markup_ngn * i.qty * (select fee_pct from public.plan_rules(s.plan)) / 100)::int as fee_ngn,
  (i.store_markup_ngn * i.qty) - round(i.store_markup_ngn * i.qty * (select fee_pct from public.plan_rules(s.plan)) / 100)::int as net_ngn,
  case when o.status in ('cancelled', 'refunded') or i.removed_at is not null then 'void'
       when i.payout_id is not null then 'paid_out'
       when o.status = 'delivered' then 'available'
       when o.status in ('awaiting_payment', 'part_paid') then 'unpaid'
       else 'pending' end as bucket
from public.orders o join public.order_items i on i.order_id = o.id join public.stores s on s.id = o.store_id
where o.store_id is not null and i.store_markup_ngn > 0;
revoke all on public.store_earnings_all from anon, authenticated;

create view public.store_earnings as
select e.* from public.store_earnings_all e join public.stores s on s.id = e.store_id
where s.owner_id = auth.uid() or public.is_staff();
revoke all on public.store_earnings from anon;
grant select on public.store_earnings to authenticated;

-- Lifetime sales and the ₦2,000,000 free-plan limit -------------------------------------
create function public.stores_count_sales() returns trigger
language plpgsql security definer set search_path = '' as $$
declare delta bigint := 0;
begin
  if new.store_id is null or new.status is not distinct from old.status then return null; end if;
  if new.status = 'paid' and old.status in ('awaiting_payment', 'part_paid') then delta := new.total_ngn; end if;
  if new.status in ('cancelled', 'refunded') and old.status not in ('awaiting_payment', 'part_paid') then delta := -old.total_ngn; end if;
  if delta = 0 then return null; end if;
  update public.stores set lifetime_sales_ngn = greatest(0, lifetime_sales_ngn + delta),
    status = case when plan = 'free' and status = 'active' and lifetime_sales_ngn + delta >= 2000000 then 'needs_upgrade' else status end
  where id = new.store_id;
  return null;
end $$;
create trigger orders_store_sales after update of status on public.orders for each row execute function public.stores_count_sales();

-- Plan changes (from payments or staff): upgrade lifts the limit; an expired plan drops to free and keeps the oldest 20 products live.
create function public.set_store_plan(p_store uuid, p_plan text, p_months int) returns void
language plpgsql security definer set search_path = '' as $$
declare st public.stores; r record;
begin
  select * into st from public.stores where id = p_store for update;
  if st.id is null then raise exception 'Unknown store'; end if;
  select * into r from public.plan_rules(p_plan);
  if r.max_products is null then raise exception 'Unknown plan'; end if;
  if p_plan = 'free' then
    update public.store_products set active = false
    where store_id = p_store and active and product_id not in (
      select product_id from public.store_products where store_id = p_store and active order by created_at limit 20);
  end if;
  update public.stores set
    plan = p_plan,
    plan_renews_at = case when p_plan = 'free' then null else greatest(coalesce(plan_renews_at, now()), now()) + make_interval(months => greatest(p_months, 1)) end,
    theme = case when theme = any (r.themes) then theme else 'studio' end,
    custom_domain = case when r.custom_domain then custom_domain end,
    status = case when status = 'suspended' then status
                  when p_plan = 'free' and lifetime_sales_ngn >= 2000000 then 'needs_upgrade' else 'active' end
  where id = p_store;
end $$;

create function public.expire_store_plans() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in select id from public.stores where plan <> 'free' and plan_renews_at < now() - interval '3 days' loop
    perform public.set_store_plan(r.id, 'free', 0); n := n + 1;
  end loop;
  return n;
end $$;

-- Places an order through a store. FastChina's part is priced exactly like the main site; markups are added on top.
create function public.place_store_order(
  p_store uuid, p_customer uuid, p_station text, p_phone text, p_mode text, p_total int, p_items jsonb, p_weeks int default null
) returns table (order_id uuid, code text, link_code text)
language plpgsql security definer set search_path = '' as $$
declare st public.stores; r record;
begin
  select * into st from public.stores where id = p_store;
  if st.id is null or st.status = 'suspended' then raise exception 'This store is closed'; end if;
  if st.status = 'needs_upgrade' then raise exception 'This store can’t take orders right now' using errcode = 'check_violation'; end if;
  select * into r from public.place_order(p_customer, p_station, p_phone, p_mode, p_total, null, 0, 0, p_items, p_weeks);
  update public.orders set store_id = p_store where id = r.order_id;
  update public.order_items i set store_markup_ngn = greatest(0, (x->>'markup')::int)
  from jsonb_array_elements(p_items) with ordinality as t(x, ord)
  where i.order_id = r.order_id and i.priority = t.ord;
  return query select r.order_id, r.code, r.link_code;
end $$;

-- Weekly payouts (Fridays): delivered earnings, net of fees, to the seller's bank account. Minimum ₦1,000.
create function public.create_weekly_payouts() returns int
language plpgsql security definer set search_path = '' as $$
declare s record; pid uuid; n int := 0;
begin
  for s in
    select e.store_id, sum(e.net_ngn)::int as net, count(*)::int as items, st.bank_name, st.account_number, st.account_name
    from public.store_earnings_all e join public.stores st on st.id = e.store_id
    where e.bucket = 'available' and st.account_number is not null and st.status <> 'suspended'
    group by e.store_id, st.bank_name, st.account_number, st.account_name
    having sum(e.net_ngn) >= 1000
  loop
    insert into public.seller_payouts (store_id, amount_ngn, items, bank_snapshot)
    values (s.store_id, s.net, s.items, jsonb_build_object('bank', s.bank_name, 'account', s.account_number, 'name', s.account_name))
    returning id into pid;
    update public.order_items i set payout_id = pid
    from public.store_earnings_all e where e.item_id = i.id and e.store_id = s.store_id and e.bucket = 'available';
    n := n + 1;
  end loop;
  return n;
end $$;

-- Store visits (for the dashboard's visits and conversion numbers).
create table public.store_visits (
  store_id uuid not null references public.stores (id) on delete cascade,
  day date not null,
  visits int not null default 0,
  primary key (store_id, day)
);
alter table public.store_visits enable row level security;
create policy "visits: owner or staff" on public.store_visits for select
  using (public.is_staff() or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
grant select on public.store_visits to authenticated;

create function public.record_store_visit(p_store uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.store_visits (store_id, day, visits) values (p_store, (now() at time zone 'Africa/Lagos')::date, 1)
  on conflict (store_id, day) do update set visits = public.store_visits.visits + 1
$$;

-- Everything the seller dashboard's home screen needs, for the signed-in owner, in one call.
create function public.seller_dashboard() returns jsonb
language sql stable security definer set search_path = '' as $$
  with st as (select * from public.stores where owner_id = auth.uid()),
  today as (select (now() at time zone 'Africa/Lagos')::date as d),
  e as (select * from public.store_earnings_all where store_id = (select id from st)),
  o as (select * from public.orders where store_id = (select id from st))
  select case when not exists (select 1 from st) then null else jsonb_build_object(
    'store', (select jsonb_build_object('id', id, 'slug', slug, 'name', name, 'tagline', tagline, 'accent', accent, 'theme', theme, 'plan', plan,
                'plan_renews_at', plan_renews_at, 'status', status, 'lifetime_sales', lifetime_sales_ngn, 'custom_domain', custom_domain,
                'domain_verified', domain_verified, 'has_bank', account_number is not null) from st),
    'rules', (select to_jsonb(r) from st, public.plan_rules(st.plan) r),
    'products', (select count(*) from public.store_products where store_id = (select id from st) and active),
    'sales_30d', (select coalesce(sum(total_ngn), 0) from o where paid_at >= now() - interval '30 days' and status not in ('cancelled', 'refunded')),
    'orders_30d', (select count(*) from o where paid_at >= now() - interval '30 days' and status not in ('cancelled', 'refunded')),
    'profit_30d', (select coalesce(sum(net_ngn), 0) from e where created_at >= now() - interval '30 days' and bucket <> 'void'),
    'visits_30d', (select coalesce(sum(visits), 0) from public.store_visits, today where store_id = (select id from st) and day > today.d - 30),
    'earnings', jsonb_build_object(
      'pending', (select coalesce(sum(net_ngn), 0) from e where bucket = 'pending'),
      'available', (select coalesce(sum(net_ngn), 0) from e where bucket = 'available'),
      'paid', (select coalesce(sum(net_ngn), 0) from e where bucket = 'paid_out')),
    'daily', (select jsonb_agg(jsonb_build_object('d', g.d, 'sales', coalesce(x.s, 0), 'visits', coalesce(v.visits, 0)) order by g.d)
              from (select generate_series((today.d - 29)::timestamp, today.d::timestamp, interval '1 day')::date as d from today) g
              left join (select (paid_at at time zone 'Africa/Lagos')::date as d, sum(total_ngn) as s from o where paid_at is not null and status not in ('cancelled', 'refunded') group by 1) x on x.d = g.d
              left join public.store_visits v on v.store_id = (select id from st) and v.day = g.d),
    'recent', (select coalesce(jsonb_agg(r order by r.created_at desc), '[]') from (
                select o.code, o.status, o.total_ngn, o.created_at, o.state,
                  (select coalesce(sum(net_ngn), 0) from e where e.order_id = o.id and bucket <> 'void') as profit
                from o order by created_at desc limit 8) r),
    'top', (select coalesce(jsonb_agg(t order by t.units desc), '[]') from (
                select i.title, sum(i.qty)::int as units, sum(e2.net_ngn)::int as profit
                from e e2 join public.order_items i on i.id = e2.item_id where e2.bucket <> 'void'
                group by i.title order by 2 desc limit 5) t)
  ) end
$$;

do $$
declare f text;
begin
  foreach f in array array['public.set_store_plan(uuid, text, int)', 'public.expire_store_plans()', 'public.place_store_order(uuid, uuid, text, text, text, int, jsonb, int)',
    'public.create_weekly_payouts()', 'public.stores_count_sales()', 'public.stores_guard()', 'public.store_products_guard()'] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
grant execute on function public.plan_rules(text) to anon, authenticated;
revoke execute on function public.seller_dashboard() from public, anon;
grant execute on function public.seller_dashboard() to authenticated;
revoke execute on function public.record_store_visit(uuid) from public, authenticated;
grant execute on function public.record_store_visit(uuid) to service_role;

select cron.schedule('fc-seller-payouts', '0 9 * * 5', 'select public.create_weekly_payouts()');
select cron.schedule('fc-store-plans', '15 1 * * *', 'select public.expire_store_plans()');
