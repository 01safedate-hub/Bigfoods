-- Wholesale market as its own channel, and fuller cost lines on every price.
--
-- Costs now on every item (retail and wholesale):
--   clearing: air ₦1,800/kg, sea ₦1,500/kg
--   local delivery to the pickup station: ₦400–₦2,000 by size (weight tiers; bulky sea items top tier)
--   a standard weighing/handling fee per item
-- Wholesale prices (sea only, 90+ days): goods + sea freight (by volume, or volume estimated from
-- weight, plus a safety buffer) + sea clearing + local delivery + weighing fee + 10–40% profit on
-- goods by category + payment fee. No coupons, points or promotions apply, so it never sells at a loss.

-- 1. Settings ------------------------------------------------------------------------------
alter table public.pricing_settings
  add column if not exists sea_clearing_per_kg numeric not null default 1500,
  add column if not exists weighing_fee_per_item numeric not null default 200,
  add column if not exists sea_kg_per_cbm numeric not null default 250 check (sea_kg_per_cbm > 0),
  add column if not exists sea_buffer numeric not null default 0.10 check (sea_buffer between 0 and 1),
  add column if not exists local_delivery_tiers jsonb not null default
    '[{"max_kg":0.25,"fee":400},{"max_kg":1,"fee":700},{"max_kg":3,"fee":1000},{"max_kg":10,"fee":1500},{"max_kg":null,"fee":2000}]',
  add column if not exists wholesale_min_qty int not null default 10 check (wholesale_min_qty >= 1);

comment on column public.pricing_settings.last_mile_per_item is 'Replaced by local_delivery_tiers (021). Kept for history.';
comment on column public.pricing_settings.weighing_fee_per_item is 'Standard weighing/handling fee added to every item, retail and wholesale.';

-- 2. Wholesale per category -------------------------------------------------------------------
alter table public.categories
  add column if not exists wholesale_margin numeric not null default 0.25 check (wholesale_margin between 0 and 1),
  add column if not exists wholesale_enabled boolean not null default true,
  add column if not exists wholesale_sort int not null default 0;

grant select (wholesale_enabled, wholesale_sort) on public.categories to anon, authenticated;

-- 3. Wholesale prices on SKUs and products ---------------------------------------------------
alter table public.product_skus
  add column if not exists price_wholesale int,
  add column if not exists wholesale_cost_ngn int,
  add column if not exists wholesale_profit_ngn int;
alter table public.products
  add column if not exists price_wholesale_min int,
  add column if not exists wholesale boolean not null default true;

grant select (price_wholesale) on public.product_skus to anon, authenticated;
grant select (price_wholesale_min, wholesale) on public.products to anon, authenticated;

-- Local delivery fee by size.
create or replace function public.local_delivery_fee(w numeric, v numeric)
returns numeric language sql stable security definer set search_path = '' as $$
  select case
    when coalesce(v, 0) >= 0.1 then (select max((t->>'fee')::numeric) from public.pricing_settings s, jsonb_array_elements(s.local_delivery_tiers) t where s.id = 1)
    else coalesce(
      (select (t->>'fee')::numeric from public.pricing_settings s, jsonb_array_elements(s.local_delivery_tiers) with ordinality as x(t, n)
        where s.id = 1 and (t->>'max_kg' is null or w <= (t->>'max_kg')::numeric) order by n limit 1),
      2000)
  end;
$$;

create or replace function public.price_sku(sku public.product_skus)
returns public.product_skus
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.pricing_settings;
  p public.products;
  c public.categories;
  rate numeric;
  goods numeric; logistics numeric; profit numeric; cost numeric; w numeric; v numeric; local_fee numeric;
  sea_v numeric; w_logistics numeric; w_profit numeric; w_cost numeric;
  r public.product_skus := sku;
begin
  select * into s from public.pricing_settings where id = 1;
  select * into p from public.products where id = sku.product_id;
  select * into c from public.categories where id = p.category_id;
  rate := round(s.naira_per_usd / s.cny_per_usd);
  w := coalesce(nullif(sku.weight_kg, 0), p.weight_kg, c.default_weight_kg, 0.5);
  v := coalesce(p.cbm, c.default_cbm, 0);
  goods := sku.cny_price * rate + coalesce(p.domestic_cny, 0) * rate;
  local_fee := public.local_delivery_fee(w, v);

  -- Retail (single items): air, or sea for big categories.
  logistics := case when coalesce(c.ship_mode, 'air') = 'sea'
                 then v * s.sea_per_cbm + w * s.sea_clearing_per_kg
                 else w * (s.air_per_kg + s.clearing_per_kg) end;
  profit := case when coalesce(c.is_gadget, false) then sku.cny_price * rate * s.gadget_pct + s.gadget_flat
                 else sku.cny_price * rate * coalesce(c.margin, 0.8) end;
  cost := goods + logistics + local_fee + s.weighing_fee_per_item;

  r.cost_ngn := cost;
  r.planned_profit_ngn := profit;
  r.price_list      := ceil((cost + profit + public.payment_fee(cost + profit)) / 100) * 100;
  r.price_midnight  := ceil((cost + profit * (1 - s.promo_midnight) + public.payment_fee(cost + profit * (1 - s.promo_midnight))) / 100) * 100;
  r.price_event     := ceil((cost + profit * (1 - s.promo_event) + public.payment_fee(cost + profit * (1 - s.promo_event))) / 100) * 100;
  r.price_flash     := ceil((cost + profit * (1 - s.promo_flash) + public.payment_fee(cost + profit * (1 - s.promo_flash))) / 100) * 100;
  r.price_retailer  := ceil((cost + profit * (1 - s.promo_retailer) + public.payment_fee(cost + profit * (1 - s.promo_retailer))) / 100) * 100;

  -- Wholesale: always by sea. Volume is the larger of the listed volume and one estimated from weight.
  sea_v := greatest(v, w / s.sea_kg_per_cbm);
  w_logistics := (sea_v * s.sea_per_cbm + w * s.sea_clearing_per_kg) * (1 + s.sea_buffer);
  w_profit := sku.cny_price * rate * coalesce(c.wholesale_margin, 0.25);
  w_cost := goods + w_logistics + local_fee + s.weighing_fee_per_item;
  r.wholesale_cost_ngn := ceil(w_cost);
  r.wholesale_profit_ngn := floor(w_profit);
  r.price_wholesale := ceil((w_cost + w_profit + public.payment_fee(w_cost + w_profit)) / 100) * 100;
  return r;
end;
$$;

create or replace function public.refresh_product_price_summary(pid uuid)
returns void language sql security definer set search_path = '' as $$
  update public.products p set
    price_list_min = x.l, price_midnight_min = x.m, price_retailer_min = x.r, price_wholesale_min = x.w, updated_at = now()
  from (
    select min(price_list) l, min(price_midnight) m, min(price_retailer) r, min(price_wholesale) w
    from public.product_skus where product_id = pid and active
  ) x
  where p.id = pid;
$$;

-- Reprice when wholesale margins change too.
drop trigger if exists categories_reprice on public.categories;
create trigger categories_reprice
  after update of margin, is_gadget, ship_mode, default_weight_kg, default_cbm, wholesale_margin on public.categories
  for each statement execute function public.reprice_on_change();

-- Changing a product's weight, volume or category reprices its SKUs (it only refreshed the summary before).
create or replace function public.products_reprice_skus()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.product_skus set cny_price = cny_price where product_id = new.id;
  return null;
end $$;
drop trigger if exists products_reprice on public.products;
create trigger products_reprice
  after update of weight_kg, cbm, domestic_cny, category_id on public.products
  for each row execute function public.products_reprice_skus();

-- Wholesale margins by category (bigger items take more).
update public.categories set wholesale_margin = v.m, wholesale_sort = v.s
from (values
  ('gadgets', 0.10, 1), ('audio', 0.15, 2), ('fashion', 0.25, 3), ('shoes', 0.25, 4), ('bags', 0.25, 5),
  ('hair', 0.20, 6), ('beauty', 0.25, 7), ('jewellery', 0.30, 8), ('kids', 0.25, 9), ('home', 0.30, 10),
  ('furniture', 0.40, 11), ('machines', 0.40, 12)
) as v(slug, m, s)
where categories.slug = v.slug;

-- 4. Orders: channel and how they travel ------------------------------------------------------
alter table public.orders
  add column if not exists channel text not null default 'retail' check (channel in ('retail', 'wholesale')),
  add column if not exists ship_mode text not null default 'air' check (ship_mode in ('air', 'sea'));
create index if not exists orders_channel_idx on public.orders (channel, status, created_at desc);
grant select (channel, ship_mode) on public.orders to authenticated;

-- Sea orders take ~90 days, so they are only auto-delivered after 90 days at sea, not 10.
create or replace function public.auto_deliver_orders() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform set_config('fastchina.note', 'auto: after shipping window', true);
  update public.orders set status = 'delivered'
  where status = 'shipped'
    and shipped_at <= now() - case when ship_mode = 'sea' then interval '90 days' else interval '10 days' end;
  get diagnostics n = row_count;
  return n;
end $$;

drop function if exists public.place_order(uuid, text, text, text, int, text, int, int, jsonb, int);
create function public.place_order(
  p_customer uuid, p_station text, p_phone text, p_mode text, p_total int,
  p_coupon text, p_coupon_amount int, p_points int, p_items jsonb, p_weeks int default null, p_channel text default 'retail'
) returns table (order_id uuid, code text, link_code text)
language plpgsql security definer set search_path = '' as $$
declare st public.pickup_stations; v_order uuid; ocode text; lcode text; why text; bal int; v_ship text; min_q int; short text;
begin
  select * into st from public.pickup_stations where id = p_station and active;
  if st.id is null then raise exception 'Choose a pickup station'; end if;
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 80 then raise exception 'Cart is empty or too large'; end if;
  if coalesce(p_coupon_amount, 0) < 0 or coalesce(p_points, 0) < 0 then raise exception 'Invalid discount'; end if;
  if p_channel not in ('retail', 'wholesale') then raise exception 'Unknown channel'; end if;

  if p_channel = 'wholesale' then
    -- Wholesale: sea only, no coupons, points or group pay, and the minimum per product.
    if coalesce(p_coupon_amount, 0) > 0 or coalesce(p_points, 0) > 0 then raise exception 'Coupons and points don’t apply to wholesale'; end if;
    if p_mode = 'group' then raise exception 'Group pay isn’t available for wholesale'; end if;
    if exists (select 1 from jsonb_array_elements(p_items) x where x->>'ship' <> 'sea') then raise exception 'Wholesale orders ship by sea'; end if;
    select wholesale_min_qty into min_q from public.pricing_settings where id = 1;
    select pr.title into short
    from jsonb_array_elements(p_items) x
    join public.product_skus k on k.id = (x->>'sku_id')::uuid
    join public.products pr on pr.id = k.product_id
    group by pr.id, pr.title having sum((x->>'qty')::int) < min_q limit 1;
    if short is not null then raise exception 'Wholesale needs at least % of each product (%)', min_q, short; end if;
  end if;

  if coalesce(p_coupon_amount, 0) > 0 then
    perform pg_advisory_xact_lock(hashtext('coupon:' || p_coupon));
    why := public.coupon_block_reason(p_coupon, p_customer);
    if why is not null then raise exception '%', why using errcode = 'check_violation'; end if;
  end if;
  if coalesce(p_points, 0) > 0 then
    if p_customer is null then raise exception 'Sign in to use points'; end if;
    perform pg_advisory_xact_lock(hashtext('points:' || p_customer::text));
    select coalesce(sum(points), 0) into bal from public.points_ledger where customer_id = p_customer;
    if bal < p_points then raise exception 'Not enough points' using errcode = 'check_violation'; end if;
  end if;

  v_ship := case when exists (select 1 from jsonb_array_elements(p_items) x where x->>'ship' = 'sea') then 'sea' else 'air' end;

  insert into public.orders (customer_id, station_id, state, pay_mode, total_ngn, phone, coupon_id, discount_ngn, channel, ship_mode)
  values (p_customer, st.id, st.state, p_mode, p_total, p_phone, case when p_coupon_amount > 0 then p_coupon end,
          coalesce(p_coupon_amount, 0) + coalesce(p_points, 0), p_channel, v_ship)
  returning id, orders.code into v_order, ocode;

  insert into public.order_items (order_id, sku_id, title, variant_label, qty, unit_ngn, cost_ngn, ship_mode, priority)
  select v_order, (x->>'sku_id')::uuid, x->>'title', nullif(x->>'variant', ''), (x->>'qty')::int, (x->>'unit')::int, (x->>'cost')::int, x->>'ship', ord::int
  from jsonb_array_elements(p_items) with ordinality as t(x, ord);

  if p_coupon_amount > 0 then
    insert into public.coupon_redemptions (coupon_id, customer_id, order_id, amount_ngn) values (p_coupon, p_customer, v_order, p_coupon_amount);
  end if;
  if p_points > 0 then
    insert into public.points_ledger (customer_id, points, reason, ref_id) values (p_customer, -p_points, 'spend', v_order);
  end if;

  if p_mode = 'small' then perform public.create_payment_plan(v_order, p_weeks); end if;
  if p_mode = 'group' then
    lcode := upper(substr(regexp_replace(st.area, '[^A-Za-z]', '', 'g'), 1, 4)) || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    insert into public.group_links (order_id, code) values (v_order, lcode);
  end if;

  perform public.notify(p_customer, 'order', case when p_channel = 'wholesale' then 'Wholesale order #' else 'Order #' end || ocode || ' placed',
    case p_mode when 'group' then 'Share your Group pay link. Items ship as they’re paid for.'
                when 'small' then 'Your Pay small small plan has started. We order from the factory when it’s fully paid.'
                else case when p_channel = 'wholesale' then 'Complete your payment and we’ll order your stock. It ships by sea and arrives in about 90 days.'
                          else 'Complete your payment and we’ll order it from the factory.' end end,
    '/track?code=' || ocode, 'order_placed',
    jsonb_build_object('code', ocode, 'total', p_total, 'pay_mode', p_mode, 'station', st.name, 'link_code', lcode, 'channel', p_channel,
      'items', p_items, 'instalments', (select jsonb_agg(jsonb_build_object('n', i.n, 'due', i.due_at, 'amount', i.amount_ngn) order by i.n)
        from public.plan_instalments i join public.payment_plans p on p.id = i.plan_id where p.order_id = v_order)),
    'order:' || v_order || ':placed');
  return query select v_order, ocode, lcode;
end $$;
revoke execute on function public.place_order(uuid, text, text, text, int, text, int, int, jsonb, int, text) from public, anon, authenticated;
grant execute on function public.place_order(uuid, text, text, text, int, text, int, int, jsonb, int, text) to service_role;

-- 5. Curated starter kits ---------------------------------------------------------------------
create table if not exists public.wholesale_kits (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  title text not null check (length(title) between 3 and 80),
  subtitle text check (length(subtitle) <= 200),
  tone text not null default 'red' check (tone in ('red', 'gold', 'blue', 'green', 'black', 'pink')),
  categories text[] not null default '{}',
  max_products int not null default 8 check (max_products between 2 and 30),
  units_each int not null default 10 check (units_each between 1 and 1000),
  sort int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.wholesale_kits enable row level security;
create policy "kits: anyone reads active" on public.wholesale_kits for select using (active or public.is_staff());
grant select on public.wholesale_kits to anon, authenticated;
comment on table public.wholesale_kits is 'Wholesale starter kits: filled automatically with the best sellers from the listed categories.';

insert into public.wholesale_kits (slug, title, subtitle, tone, categories, max_products, units_each, sort) values
  ('fashion-store', 'Start a fashion store', 'Best-selling dresses, sets, shoes and bags to open with.', 'red', '{fashion,shoes,bags}', 8, 10, 1),
  ('phone-business', 'Start a phone & accessories business', 'Phones plus the earbuds and chargers that sell with them.', 'black', '{gadgets,audio}', 8, 10, 2),
  ('hair-beauty', 'Open a hair & beauty shop', 'Wigs, bundles, lashes and makeup salons reorder every week.', 'pink', '{hair,beauty}', 8, 10, 3),
  ('jewellery-watches', 'Jewellery & watches stall', 'Small, light and high margin: easy to start with.', 'gold', '{jewellery}', 6, 10, 4),
  ('home-kitchen', 'Home & kitchen shop', 'Everyday home items that move fast.', 'green', '{home,kids}', 8, 10, 5)
on conflict (slug) do nothing;

-- 6. Reprice everything with the new cost lines.
select public.reprice_all();

-- Event copy without supplier names.
update public.sale_events set title = replace(title, '1688 factories', 'the factory floor') where title like '%1688%';
