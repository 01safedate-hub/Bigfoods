-- 1. Store aliases: fastchina.store/<alias> (or /<slug> by default). Staff set aliases.
-- 2. Wholesale delivery: no pickup station. Customers give their state and address; local delivery
--    after customs is arranged and billed separately by state, so it's no longer in wholesale prices.
-- 3. Warehouse photo check: staff photos of each order item at the China warehouse.
-- 4. Photo reviews: customers review items from delivered orders; staff publish them.

-- 1 -------------------------------------------------------------------------------------------
alter table public.stores add column if not exists alias text unique check (alias ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$');
grant select (alias) on public.stores to anon, authenticated;
comment on column public.stores.alias is 'Optional short address set by staff: fastchina.store/<alias>. Defaults to the slug.';

-- An alias can't be someone else's slug.
create or replace function public.stores_alias_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.alias is not null and exists (select 1 from public.stores where slug = new.alias and id <> new.id) then
    raise exception 'That address is another store''s name';
  end if;
  if new.alias is distinct from old.alias and not public.is_staff() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only staff can set a store alias';
  end if;
  return new;
end $$;
drop trigger if exists stores_alias_guard on public.stores;
create trigger stores_alias_guard before update of alias on public.stores for each row execute function public.stores_alias_guard();

-- Store names and aliases are addresses (fastchina.store/<name>), so site words are reserved.
alter table public.stores drop constraint if exists stores_name_not_reserved;
alter table public.stores add constraint stores_name_not_reserved check (slug not in ('www', 'admin', 'api', 'app', 'store', 'shop', 'seller', 'sellers', 'mail', 'help', 'support', 'fastchina', 'static', 'assets', 'pwa', 'sign-in', 'signin', 'login', 'legal', 'track', 'offline', 'wholesale', 'guides', 'category', 'categories', 'product', 'products', 'deals', 'search', 'cart', 'checkout', 'account', 'wishlist', 'notifications', 'unsubscribe', 'sitemap', 'robots', 'opengraph-image', 'about', 'contact', 'blog', 'why-fastchina', 'terms', 'privacy') and coalesce(alias, '-') not in ('www', 'admin', 'api', 'app', 'store', 'shop', 'seller', 'sellers', 'mail', 'help', 'support', 'fastchina', 'static', 'assets', 'pwa', 'sign-in', 'signin', 'login', 'legal', 'track', 'offline', 'wholesale', 'guides', 'category', 'categories', 'product', 'products', 'deals', 'search', 'cart', 'checkout', 'account', 'wishlist', 'notifications', 'unsubscribe', 'sitemap', 'robots', 'opengraph-image', 'about', 'contact', 'blog', 'why-fastchina', 'terms', 'privacy'));

-- 2 -------------------------------------------------------------------------------------------
alter table public.orders alter column station_id drop not null;
alter table public.orders
  add column if not exists delivery_city text check (length(delivery_city) <= 80),
  add column if not exists delivery_address text check (length(delivery_address) <= 300);
alter table public.orders drop constraint if exists orders_station_or_wholesale;
alter table public.orders add constraint orders_station_or_wholesale check (station_id is not null or channel = 'wholesale');

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

  -- Single items: free delivery to the pickup station is inside the price.
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

  -- Wholesale: by sea to Lagos and cleared. Local delivery is billed separately by state.
  sea_v := greatest(v, w / s.sea_kg_per_cbm);
  w_logistics := (sea_v * s.sea_per_cbm + w * s.sea_clearing_per_kg) * (1 + s.sea_buffer);
  w_profit := sku.cny_price * rate * coalesce(c.wholesale_margin, 0.25);
  w_cost := goods + w_logistics + s.weighing_fee_per_item;
  r.wholesale_cost_ngn := ceil(w_cost);
  r.wholesale_profit_ngn := floor(w_profit);
  r.price_wholesale := ceil((w_cost + w_profit + public.payment_fee(w_cost + w_profit)) / 100) * 100;
  return r;
end;
$$;

drop function if exists public.place_order(uuid, text, text, text, int, text, int, int, jsonb, int, text);
create function public.place_order(
  p_customer uuid, p_station text, p_phone text, p_mode text, p_total int,
  p_coupon text, p_coupon_amount int, p_points int, p_items jsonb, p_weeks int default null, p_channel text default 'retail',
  p_delivery jsonb default null
) returns table (order_id uuid, code text, link_code text)
language plpgsql security definer set search_path = '' as $$
declare st public.pickup_stations; v_order uuid; ocode text; lcode text; why text; bal int; v_ship text; min_q int; short text;
        v_state text; v_city text; v_addr text;
begin
  if p_channel not in ('retail', 'wholesale') then raise exception 'Unknown channel'; end if;
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 80 then raise exception 'Cart is empty or too large'; end if;
  if coalesce(p_coupon_amount, 0) < 0 or coalesce(p_points, 0) < 0 then raise exception 'Invalid discount'; end if;

  if p_channel = 'wholesale' then
    v_state := nullif(trim(p_delivery->>'state'), '');
    v_city := nullif(trim(p_delivery->>'city'), '');
    v_addr := nullif(trim(p_delivery->>'address'), '');
    if v_state is null or v_city is null then raise exception 'Enter your state and city for delivery'; end if;
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
  else
    select * into st from public.pickup_stations where id = p_station and active;
    if st.id is null then raise exception 'Choose a pickup station'; end if;
    v_state := st.state;
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

  insert into public.orders (customer_id, station_id, state, pay_mode, total_ngn, phone, coupon_id, discount_ngn, channel, ship_mode, delivery_city, delivery_address)
  values (p_customer, st.id, v_state, p_mode, p_total, p_phone, case when p_coupon_amount > 0 then p_coupon end,
          coalesce(p_coupon_amount, 0) + coalesce(p_points, 0), p_channel, v_ship, v_city, v_addr)
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
                else case when p_channel = 'wholesale' then 'Complete your payment and we’ll order your stock. It ships by sea (about 90 days); delivery to you is arranged and billed by state when it clears.'
                          else 'Complete your payment and we’ll order it from the factory.' end end,
    '/track?code=' || ocode, 'order_placed',
    jsonb_build_object('code', ocode, 'total', p_total, 'pay_mode', p_mode, 'station', coalesce(st.name, v_city || ', ' || v_state), 'link_code', lcode, 'channel', p_channel,
      'items', p_items, 'instalments', (select jsonb_agg(jsonb_build_object('n', i.n, 'due', i.due_at, 'amount', i.amount_ngn) order by i.n)
        from public.plan_instalments i join public.payment_plans p on p.id = i.plan_id where p.order_id = v_order)),
    'order:' || v_order || ':placed');
  return query select v_order, ocode, lcode;
end $$;
revoke execute on function public.place_order(uuid, text, text, text, int, text, int, int, jsonb, int, text, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(uuid, text, text, text, int, text, int, int, jsonb, int, text, jsonb) to service_role;

-- 3 -------------------------------------------------------------------------------------------
create table if not exists public.order_item_photos (
  id bigint generated always as identity primary key,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  url text not null check (url ~ '^https://'),
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_item_photos_item_idx on public.order_item_photos (order_item_id);
alter table public.order_item_photos enable row level security;
create policy "item photos: owner or staff" on public.order_item_photos for select using (
  public.is_staff() or exists (select 1 from public.order_items i join public.orders o on o.id = i.order_id where i.id = order_item_id and o.customer_id = (select auth.uid()))
);
grant select on public.order_item_photos to authenticated;

-- Tracking shows the warehouse photos, and works for wholesale orders (no pickup station).
create or replace function public.track_order(p_code text, p_last4 text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', o.code, 'status', o.status, 'pay_mode', o.pay_mode, 'total', o.total_ngn, 'paid', o.paid_ngn,
    'created_at', o.created_at, 'paid_at', o.paid_at, 'shipped_at', o.shipped_at, 'delivered_at', o.delivered_at,
    'station', coalesce(s.name, concat_ws(', ', o.delivery_city, o.state)), 'state', o.state, 'channel', o.channel, 'ship_mode', o.ship_mode,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('title', i.title, 'variant', i.variant_label, 'qty', i.qty, 'unit', i.unit_ngn,
                'ship', i.ship_mode, 'funded', i.released_at is not null, 'removed', i.removed_at is not null,
                'photos', (select coalesce(jsonb_agg(ph.url order by ph.id), '[]') from public.order_item_photos ph where ph.order_item_id = i.id)) order by i.priority), '[]')
              from public.order_items i where i.order_id = o.id),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('to', e.to_status, 'at', e.at) order by e.at), '[]') from public.order_events e where e.order_id = o.id),
    'plan', (select jsonb_build_object('status', p.status, 'instalments',
                (select jsonb_agg(jsonb_build_object('n', i.n, 'due', i.due_at, 'amount', i.amount_ngn) order by i.n) from public.plan_instalments i where i.plan_id = p.id))
             from public.payment_plans p where p.order_id = o.id),
    'link', (select jsonb_build_object('code', l.code, 'expires_at', l.expires_at) from public.group_links l where l.order_id = o.id)
  )
  from public.orders o left join public.pickup_stations s on s.id = o.station_id
  where o.code = upper(p_code) and o.phone is not null and right(o.phone, 4) = p_last4
$$;
revoke execute on function public.track_order(text, text) from public, anon, authenticated;
grant execute on function public.track_order(text, text) to service_role;

-- Sea orders: the "on the way" message gives a sea date.
create or replace function public.shipped_eta(o public.orders) returns text
language sql stable set search_path = '' as $$
  select to_char((o.shipped_at at time zone 'Africa/Lagos') + case when o.ship_mode = 'sea' then interval '75 days' else interval '10 days' end, 'FMDD Mon');
$$;

-- Order messages use the sea date for sea orders.
create or replace function public.orders_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare note text := coalesce(current_setting('fastchina.note', true), ''); t text; title text; body text; d jsonb;
begin
  if new.status in ('cancelled', 'refunded') and old.status is distinct from new.status then
    update public.coupon_redemptions set released_at = now() where order_id = new.id and released_at is null;
    insert into public.points_ledger (customer_id, points, reason, ref_id)
    select customer_id, -points, 'refund', new.id from public.points_ledger where reason = 'spend' and ref_id = new.id
    and not exists (select 1 from public.points_ledger x where x.reason = 'refund' and x.ref_id = new.id);
  end if;

  if new.paid_ngn > old.paid_ngn and new.paid_ngn < new.total_ngn then
    perform public.notify(new.customer_id, 'payment', 'Payment received', public.naira_text(new.paid_ngn - old.paid_ngn) || ' received for order #' || new.code || '. ' || public.naira_text(new.total_ngn - new.paid_ngn) || ' to go.',
      '/track?code=' || new.code, 'payment_received',
      jsonb_build_object('code', new.code, 'amount', new.paid_ngn - old.paid_ngn, 'paid', new.paid_ngn, 'total', new.total_ngn, 'pay_mode', new.pay_mode),
      'order:' || new.id || ':paid:' || new.paid_ngn);
  end if;
  if new.status is not distinct from old.status then return null; end if;

  d := jsonb_build_object('code', new.code, 'total', new.total_ngn, 'paid', new.paid_ngn, 'pay_mode', new.pay_mode,
    'station', coalesce((select name from public.pickup_stations where id = new.station_id), concat_ws(', ', new.delivery_city, new.state)), 'shipped_at', new.shipped_at,
    'items', (select jsonb_agg(jsonb_build_object('title', i.title, 'variant', i.variant_label, 'qty', i.qty)) from public.order_items i where i.order_id = new.id and i.removed_at is null));
  case new.status
    when 'paid' then t := 'payment_complete'; title := 'Fully paid · #' || new.code; body := 'We’re ordering your items from the factory now.';
    when 'purchased' then t := 'order_bought'; title := 'Bought from the factory'; body := 'Your items for #' || new.code || ' are on their way to our China warehouse for a photo check.';
    when 'shipped' then t := 'order_shipped'; title := 'On the way · #' || new.code; body := case when new.ship_mode = 'sea' then 'Your order left China by sea. Expect it around ' || public.shipped_eta(new) || '.' else 'Your order left China. It’ll be at your pickup station by ' || public.shipped_eta(new) || '.' end;
    when 'delivered' then t := 'order_ready';
      if new.channel = 'wholesale' then title := 'Arrived in Nigeria · #' || new.code; body := 'Your stock has cleared customs. We’ll call you to arrange delivery to ' || coalesce(new.delivery_city, new.state) || '; local delivery is billed by state.';
      else title := 'Ready for pickup · #' || new.code; body := 'Your order is at your Jumia pickup station. Bring your pickup code and an ID.'; end if;
    when 'refunded' then t := 'order_refunded'; title := 'Refunded · #' || new.code; body := public.naira_text(old.paid_ngn) || ' is back in your wallet.';
    when 'cancelled' then
      if note like 'auto: plan%' then t := 'plan_cancelled'; title := 'Pay small small plan cancelled'; body := 'A payment was 14 days overdue, so order #' || new.code || ' was cancelled. Everything you paid is in your wallet.';
      elsif note like 'auto: group%' then t := 'order_cancelled'; title := 'Group pay link closed'; body := 'Nothing was fully paid in time, so #' || new.code || ' was cancelled. Contributions were returned.';
      else t := 'order_cancelled'; title := 'Order #' || new.code || ' cancelled'; body := case when old.paid_ngn > 0 then public.naira_text(old.paid_ngn) || ' is back in your wallet.' else 'Nothing was charged.' end;
      end if;
    else return null;
  end case;
  perform public.notify(new.customer_id, 'order', title, body, '/track?code=' || new.code, t, d || jsonb_build_object('refund', old.paid_ngn, 'reason', note), 'order:' || new.id || ':' || new.status);
  return null;
end $$;

-- 4 -------------------------------------------------------------------------------------------
create table if not exists public.product_reviews (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  customer_id uuid references auth.users (id) on delete set null,
  order_item_id uuid unique references public.order_items (id) on delete set null,
  author text not null check (length(author) between 1 and 40),
  variant_label text,
  rating int not null check (rating between 1 and 5),
  body text check (length(body) <= 1500),
  photos text[] not null default '{}' check (cardinality(photos) <= 6),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now()
);
create index if not exists product_reviews_product_idx on public.product_reviews (product_id, status, created_at desc);
alter table public.product_reviews enable row level security;
create policy "reviews: published, own or staff" on public.product_reviews for select
  using (status = 'published' or customer_id = (select auth.uid()) or public.is_staff());
grant select (id, product_id, author, variant_label, rating, body, photos, status, created_at) on public.product_reviews to anon, authenticated;

-- Only items from your own delivered orders can be reviewed, once each.
create or replace function public.submit_review(p_item uuid, p_rating int, p_body text, p_photos text[], p_author text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare it record; rid bigint;
begin
  if auth.uid() is null then raise exception 'Sign in to review'; end if;
  select i.id, i.variant_label, k.product_id into it
  from public.order_items i join public.orders o on o.id = i.order_id join public.product_skus k on k.id = i.sku_id
  where i.id = p_item and o.customer_id = auth.uid() and o.status = 'delivered';
  if it.id is null then raise exception 'You can review items from delivered orders'; end if;
  if p_rating not between 1 and 5 then raise exception 'Pick 1 to 5 stars'; end if;
  if coalesce(array_length(p_photos, 1), 0) > 6 or exists (select 1 from unnest(coalesce(p_photos, '{}')) u where u !~ '^https://') then raise exception 'Bad photos'; end if;
  insert into public.product_reviews (product_id, customer_id, order_item_id, author, variant_label, rating, body, photos)
  values (it.product_id, auth.uid(), it.id, left(coalesce(nullif(trim(p_author), ''), 'FastChina customer'), 40), it.variant_label, p_rating, nullif(trim(p_body), ''), coalesce(p_photos, '{}'))
  returning id into rid;
  return rid;
end $$;
revoke execute on function public.submit_review(uuid, int, text, text[], text) from public, anon;
grant execute on function public.submit_review(uuid, int, text, text[], text) to authenticated;

-- Product rating and review count follow published reviews.
create or replace function public.reviews_refresh_product() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating = coalesce((select round(avg(rating)::numeric, 1) from public.product_reviews r where r.product_id = pid and r.status = 'published'), p.rating),
    reviews = (select count(*) from public.product_reviews r where r.product_id = pid and r.status = 'published')
  where p.id = pid and exists (select 1 from public.product_reviews r where r.product_id = pid and r.status = 'published');
  return null;
end $$;
drop trigger if exists product_reviews_refresh on public.product_reviews;
create trigger product_reviews_refresh after insert or update of status or delete on public.product_reviews
  for each row execute function public.reviews_refresh_product();

select public.reprice_all();
