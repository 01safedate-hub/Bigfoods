-- Pricing settings (single row) ---------------------------------------------
create table public.pricing_settings (
  id smallint primary key default 1 check (id = 1),
  naira_per_usd numeric not null default 2100,
  cny_per_usd numeric not null default 6.6664,
  air_per_kg numeric not null default 15000,
  clearing_per_kg numeric not null default 1800,
  sea_per_cbm numeric not null default 420000,
  last_mile_per_item numeric not null default 1500,
  fee_pct numeric not null default 1.5,
  fee_flat numeric not null default 100,
  fee_flat_from numeric not null default 2500,
  fee_cap numeric not null default 2000,
  gadget_pct numeric not null default 0.10,
  gadget_flat numeric not null default 50000,
  promo_midnight numeric not null default 0.20,
  promo_event numeric not null default 0.30,
  promo_flash numeric not null default 0.50,
  promo_retailer numeric not null default 0.40,
  max_discount_share numeric not null default 0.50,
  max_coupon_share numeric not null default 0.25,
  max_points_share numeric not null default 0.10,
  retailer_min_qty int not null default 10,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);
comment on table public.pricing_settings is 'Single source of pricing numbers. Mirrors src/lib/pricing/config.ts. Staff-only.';
insert into public.pricing_settings (id) values (1);

-- Standard yuan rate: round(naira_per_usd / cny_per_usd) = ₦315.
create or replace function public.naira_per_cny()
returns numeric language sql stable security definer set search_path = '' as $$
  select round(naira_per_usd / cny_per_usd) from public.pricing_settings where id = 1;
$$;

-- Categories ------------------------------------------------------------------
create type public.ship_mode as enum ('air', 'sea');

create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  parent_id bigint references public.categories (id) on delete set null,
  margin numeric not null default 0.8 check (margin >= 0 and margin <= 3),
  is_gadget boolean not null default false,
  ship_mode public.ship_mode not null default 'air',
  default_weight_kg numeric not null default 0.5 check (default_weight_kg > 0),
  default_cbm numeric,
  tmapi_cat_ids bigint[] not null default '{}',
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categories (slug, name, margin, is_gadget, ship_mode, default_weight_kg, default_cbm, sort) values
  ('gadgets', 'Phones & Gadgets', 0, true, 'air', 0.6, null, 10),
  ('fashion', 'Fashion', 0.80, false, 'air', 0.35, null, 20),
  ('hair', 'Hair & Wigs', 0.70, false, 'air', 0.4, null, 30),
  ('beauty', 'Beauty', 0.90, false, 'air', 0.2, null, 40),
  ('jewellery', 'Jewellery & Watches', 0.90, false, 'air', 0.15, null, 50),
  ('audio', 'Phone accessories & Audio', 0.90, false, 'air', 0.2, null, 60),
  ('shoes', 'Shoes', 0.75, false, 'air', 0.9, null, 70),
  ('bags', 'Bags', 0.85, false, 'air', 0.5, null, 80),
  ('home', 'Home & Kitchen', 0.80, false, 'air', 0.8, null, 90),
  ('kids', 'Kids & Baby', 0.80, false, 'air', 0.4, null, 100),
  ('furniture', 'Furniture', 0.60, false, 'sea', 20, 0.3, 110),
  ('machines', 'Machines', 0.60, false, 'sea', 50, 0.4, 120);

-- Products --------------------------------------------------------------------
create type public.product_status as enum ('draft', 'active', 'hidden', 'sold_out');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  -- Public fields
  title text not null,
  description text,
  category_id bigint references public.categories (id) on delete set null,
  status public.product_status not null default 'draft',
  main_images text[] not null default '{}',
  video_url text,
  props jsonb not null default '[]',
  sale_count int not null default 0,
  rating numeric,
  badge text,
  is_new boolean not null default false,
  price_list_min int,
  price_midnight_min int,
  price_retailer_min int,
  -- Private (staff only): sourcing and costs
  source text not null default '1688',
  source_item_id bigint,
  source_url text,
  title_zh text,
  supplier jsonb not null default '{}',
  location text,
  weight_kg numeric check (weight_kg is null or weight_kg > 0),
  cbm numeric,
  domestic_cny numeric not null default 0,
  cny_min numeric,
  cny_max numeric,
  tiered_prices jsonb not null default '[]',
  mixed_batch jsonb not null default '{}',
  raw jsonb,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_item_id)
);
create index products_category_idx on public.products (category_id) where status = 'active';

create table public.product_skus (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- Public
  props jsonb not null default '{}',
  props_text text,
  image_url text,
  stock int not null default 0,
  price_list int,
  price_midnight int,
  price_event int,
  price_flash int,
  price_retailer int,
  active boolean not null default true,
  -- Private
  source_sku_id text not null,
  source_spec_id text,
  cny_price numeric not null check (cny_price >= 0),
  weight_kg numeric,
  cost_ngn numeric,
  planned_profit_ngn numeric,
  updated_at timestamptz not null default now(),
  unique (product_id, source_sku_id)
);
create index product_skus_product_idx on public.product_skus (product_id);

-- Price engine (mirrors src/lib/pricing/engine.ts) ------------------------------
create or replace function public.payment_fee(amount numeric)
returns numeric language sql stable security definer set search_path = '' as $$
  select case when amount <= 0 then 0
    else least(s.fee_cap, amount * s.fee_pct / 100 + case when amount >= s.fee_flat_from then s.fee_flat else 0 end) end
  from public.pricing_settings s where s.id = 1;
$$;

create or replace function public.price_sku(sku public.product_skus)
returns public.product_skus
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.pricing_settings;
  p public.products;
  c public.categories;
  rate numeric;
  goods numeric; logistics numeric; profit numeric; cost numeric; w numeric; v numeric;
  function_result public.product_skus := sku;
begin
  select * into s from public.pricing_settings where id = 1;
  select * into p from public.products where id = sku.product_id;
  select * into c from public.categories where id = p.category_id;
  rate := round(s.naira_per_usd / s.cny_per_usd);
  w := coalesce(nullif(sku.weight_kg, 0), p.weight_kg, c.default_weight_kg, 0.5);
  v := coalesce(p.cbm, c.default_cbm, 0);
  goods := sku.cny_price * rate;
  logistics := case when coalesce(c.ship_mode, 'air') = 'sea'
                 then v * s.sea_per_cbm + w * s.clearing_per_kg
                 else w * (s.air_per_kg + s.clearing_per_kg) end
               + coalesce(p.domestic_cny, 0) * rate;
  profit := case when coalesce(c.is_gadget, false) then goods * s.gadget_pct + s.gadget_flat
                 else goods * coalesce(c.margin, 0.8) end;
  cost := goods + logistics + s.last_mile_per_item;

  function_result.cost_ngn := cost;
  function_result.planned_profit_ngn := profit;
  function_result.price_list      := ceil((cost + profit + public.payment_fee(cost + profit)) / 100) * 100;
  function_result.price_midnight  := ceil((cost + profit * (1 - s.promo_midnight) + public.payment_fee(cost + profit * (1 - s.promo_midnight))) / 100) * 100;
  function_result.price_event     := ceil((cost + profit * (1 - s.promo_event) + public.payment_fee(cost + profit * (1 - s.promo_event))) / 100) * 100;
  function_result.price_flash     := ceil((cost + profit * (1 - s.promo_flash) + public.payment_fee(cost + profit * (1 - s.promo_flash))) / 100) * 100;
  function_result.price_retailer  := ceil((cost + profit * (1 - s.promo_retailer) + public.payment_fee(cost + profit * (1 - s.promo_retailer))) / 100) * 100;
  return function_result;
end;
$$;

create or replace function public.product_skus_set_prices()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new := public.price_sku(new);
  new.updated_at := now();
  return new;
end;
$$;

create trigger product_skus_prices
  before insert or update of cny_price, weight_kg, product_id on public.product_skus
  for each row execute function public.product_skus_set_prices();

-- Keep the "from" prices on products in step with their SKUs.
create or replace function public.refresh_product_price_summary(pid uuid)
returns void language sql security definer set search_path = '' as $$
  update public.products p set
    price_list_min = x.l, price_midnight_min = x.m, price_retailer_min = x.r, updated_at = now()
  from (
    select min(price_list) l, min(price_midnight) m, min(price_retailer) r
    from public.product_skus where product_id = pid and active
  ) x
  where p.id = pid;
$$;

create or replace function public.product_skus_after_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.refresh_product_price_summary(coalesce(new.product_id, old.product_id));
  return null;
end;
$$;

create trigger product_skus_summary
  after insert or update or delete on public.product_skus
  for each row execute function public.product_skus_after_change();

-- Reprice everything (after a settings or category change).
create or replace function public.reprice_all()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.product_skus set cny_price = cny_price;
end;
$$;

create or replace function public.reprice_on_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.reprice_all();
  return null;
end;
$$;

create trigger pricing_settings_reprice
  after update on public.pricing_settings
  for each statement execute function public.reprice_on_change();

create trigger categories_reprice
  after update of margin, is_gadget, ship_mode, default_weight_kg, default_cbm on public.categories
  for each statement execute function public.reprice_on_change();

create trigger products_reprice
  after update of weight_kg, cbm, domestic_cny, category_id on public.products
  for each row execute function public.product_skus_after_change();

-- API call log (cost and error tracking) ---------------------------------------
create table public.api_calls (
  id bigint generated always as identity primary key,
  provider text not null default 'tmapi',
  endpoint text not null,
  params jsonb not null default '{}',
  http_status int,
  api_code int,
  message text,
  duration_ms int,
  created_at timestamptz not null default now()
);
create index api_calls_created_idx on public.api_calls (created_at desc);

-- Row level security ------------------------------------------------------------
alter table public.pricing_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_skus enable row level security;
alter table public.api_calls enable row level security;

create policy "Staff read pricing settings" on public.pricing_settings for select to authenticated using (public.is_staff());
create policy "Finance and super admin edit pricing settings" on public.pricing_settings for update to authenticated
  using (public.has_role(array['super_admin','finance']::public.app_role[]))
  with check (public.has_role(array['super_admin','finance']::public.app_role[]));

create policy "Anyone reads active categories" on public.categories for select to anon, authenticated using (active or public.is_staff());
create policy "Super admin and finance manage categories" on public.categories for all to authenticated
  using (public.has_role(array['super_admin','finance']::public.app_role[]))
  with check (public.has_role(array['super_admin','finance']::public.app_role[]));

create policy "Anyone reads active products" on public.products for select to anon, authenticated
  using (status in ('active', 'sold_out') or public.is_staff());
create policy "Catalogue staff manage products" on public.products for all to authenticated
  using (public.has_role(array['super_admin','purchasing','marketing']::public.app_role[]))
  with check (public.has_role(array['super_admin','purchasing','marketing']::public.app_role[]));

create policy "Anyone reads SKUs of visible products" on public.product_skus for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.status in ('active', 'sold_out') or public.is_staff())));
create policy "Catalogue staff manage SKUs" on public.product_skus for all to authenticated
  using (public.has_role(array['super_admin','purchasing','marketing']::public.app_role[]))
  with check (public.has_role(array['super_admin','purchasing','marketing']::public.app_role[]));

create policy "Staff read API log" on public.api_calls for select to authenticated using (public.is_staff());

-- Column privileges: customers never see costs, margins or the 1688 supplier ---------
revoke select on public.products from anon, authenticated;
grant select (id, slug, title, description, category_id, status, main_images, video_url, props, sale_count, rating, badge, is_new,
              price_list_min, price_midnight_min, price_retailer_min, created_at, updated_at)
  on public.products to anon, authenticated;
revoke select on public.product_skus from anon, authenticated;
grant select (id, product_id, props, props_text, image_url, stock, price_list, price_midnight, price_event, price_flash, price_retailer, active, updated_at)
  on public.product_skus to anon, authenticated;
revoke select on public.categories from anon, authenticated;
grant select (id, slug, name, parent_id, ship_mode, is_gadget, sort, active) on public.categories to anon, authenticated;
revoke all on public.pricing_settings, public.api_calls from anon;

-- Staff read everything through a server-side client (service role) or these grants.
grant select on public.products, public.product_skus, public.categories to service_role;

revoke execute on function public.price_sku(public.product_skus), public.product_skus_set_prices(), public.product_skus_after_change(),
  public.reprice_all(), public.reprice_on_change(), public.refresh_product_price_summary(uuid) from public, anon, authenticated;

-- Image bucket (mirrored product images) ---------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
