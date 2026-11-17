-- 009: placing orders, guest tracking, purchasing and dispatch.

alter table public.orders
  add column phone text check (phone ~ '^\+?[0-9]{10,15}$'),
  add column coupon_id text references public.coupons (id),
  add column discount_ngn int not null default 0 check (discount_ngn >= 0);

-- Full payment releases every item, even when a coupon makes the total lower than the item prices.
create or replace function public.release_funded_items(p_order uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with ranked as (
    select i.id, sum(i.unit_ngn * i.qty) over (order by i.priority, i.id) as running
    from public.order_items i where i.order_id = p_order and i.removed_at is null
  )
  update public.order_items i set released_at = now()
  from ranked r, public.orders o
  where i.id = r.id and o.id = p_order and i.released_at is null and (r.running <= o.paid_ngn or o.paid_ngn >= o.total_ngn);
  get diagnostics n = row_count;
  return n;
end $$;

-- Coupons can make the total lower than item prices: never keep more than was paid.
create or replace function public.settle_group_links() returns int
language plpgsql security definer set search_path = '' as $$
declare l record; kept int; leftover int; n int := 0;
begin
  for l in
    select gl.id, gl.order_id from public.group_links gl join public.orders o on o.id = gl.order_id
    where gl.settled_at is null and gl.expires_at <= now() and o.status in ('awaiting_payment', 'part_paid')
    for update of gl, o
  loop
    perform public.release_funded_items(l.order_id);
    select coalesce(sum(unit_ngn * qty), 0) into kept from public.order_items where order_id = l.order_id and released_at is not null and removed_at is null;
    select least(kept, o.paid_ngn), o.paid_ngn - least(kept, o.paid_ngn) into kept, leftover from public.orders o where o.id = l.order_id;
    update public.order_items set removed_at = now() where order_id = l.order_id and released_at is null and removed_at is null;

    if leftover > 0 then
      with c as (
        select id, customer_id, amount_ngn, (leftover::numeric * amount_ngn / sum(amount_ngn) over ()) as exact
        from public.group_contributions where link_id = l.id
      ), f as (
        select *, floor(exact)::int as fl, row_number() over (order by exact - floor(exact) desc, id) as rk from c
      ), shares as (
        select id, customer_id, fl + case when rk <= leftover - (sum(fl) over ())::int then 1 else 0 end as share from f
      ), to_wallet as (
        insert into public.wallet_ledger (customer_id, amount_ngn, reason, ref_id)
        select customer_id, share, 'group_refund', l.id from shares where share > 0 and customer_id is not null returning 1
      )
      insert into public.refunds_due (source, ref_id, amount_ngn)
      select 'group', id, share from shares where share > 0 and customer_id is null;
    end if;

    perform set_config('fastchina.note', 'auto: group link expired', true);
    if kept > 0 then
      update public.orders set total_ngn = kept, paid_ngn = kept where id = l.order_id;   -- status becomes paid
    else
      update public.orders set paid_ngn = 0, status = 'cancelled' where id = l.order_id;
    end if;
    update public.group_links set settled_at = now() where id = l.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Creates an order from a quote the server has already priced. Items: [{sku_id, qty, unit, cost, title, variant, ship}].
create function public.place_order(
  p_customer uuid, p_station text, p_phone text, p_mode text, p_total int, p_discount int, p_coupon text,
  p_items jsonb, p_weeks int default null
) returns table (order_id uuid, code text, link_code text)
language plpgsql security definer set search_path = '' as $$
declare st public.pickup_stations; v_order uuid; ocode text; lcode text;
begin
  select * into st from public.pickup_stations where id = p_station and active;
  if st.id is null then raise exception 'Choose a pickup station'; end if;
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then raise exception 'Cart is empty or too large'; end if;

  insert into public.orders (customer_id, station_id, state, pay_mode, total_ngn, phone, coupon_id, discount_ngn)
  values (p_customer, st.id, st.state, p_mode, p_total, p_phone, p_coupon, p_discount)
  returning id, orders.code into v_order, ocode;

  insert into public.order_items (order_id, sku_id, title, variant_label, qty, unit_ngn, cost_ngn, ship_mode, priority)
  select v_order, (x->>'sku_id')::uuid, x->>'title', nullif(x->>'variant', ''), (x->>'qty')::int, (x->>'unit')::int, (x->>'cost')::int, x->>'ship', ord::int
  from jsonb_array_elements(p_items) with ordinality as t(x, ord);

  if p_mode = 'small' then perform public.create_payment_plan(v_order, p_weeks); end if;
  if p_mode = 'group' then
    lcode := upper(substr(regexp_replace(st.area, '[^A-Za-z]', '', 'g'), 1, 4)) || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    insert into public.group_links (order_id, code) values (v_order, lcode);
  end if;
  return query select v_order, ocode, lcode;
end $$;

-- Guest tracking: order code + last 4 digits of the phone used at checkout. No address, no other customers.
create function public.track_order(p_code text, p_last4 text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', o.code, 'status', o.status, 'pay_mode', o.pay_mode, 'total', o.total_ngn, 'paid', o.paid_ngn,
    'created_at', o.created_at, 'paid_at', o.paid_at, 'shipped_at', o.shipped_at, 'delivered_at', o.delivered_at,
    'station', s.name, 'state', o.state,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('title', i.title, 'variant', i.variant_label, 'qty', i.qty, 'unit', i.unit_ngn,
                'ship', i.ship_mode, 'funded', i.released_at is not null, 'removed', i.removed_at is not null) order by i.priority), '[]')
              from public.order_items i where i.order_id = o.id),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('to', e.to_status, 'at', e.at) order by e.at), '[]') from public.order_events e where e.order_id = o.id),
    'plan', (select jsonb_build_object('status', p.status, 'instalments',
                (select jsonb_agg(jsonb_build_object('n', i.n, 'due', i.due_at, 'amount', i.amount_ngn) order by i.n) from public.plan_instalments i where i.plan_id = p.id))
             from public.payment_plans p where p.order_id = o.id),
    'link', (select jsonb_build_object('code', l.code, 'expires_at', l.expires_at) from public.group_links l where l.order_id = o.id)
  )
  from public.orders o join public.pickup_stations s on s.id = o.station_id
  where o.code = upper(p_code) and o.phone is not null and right(o.phone, 4) = p_last4
$$;

-- Purchasing: record how many of a variant we bought in total; it fills the oldest paid orders first,
-- moves orders to "purchasing" when buying starts and to "purchased" when every item is bought.
create function public.record_purchase(p_sku uuid, p_bought int) returns int
language plpgsql security definer set search_path = '' as $$
declare r record; left_qty int := greatest(p_bought, 0); n int := 0;
begin
  for r in
    select i.id, i.qty, i.order_id from public.order_items i join public.orders o on o.id = i.order_id
    where i.sku_id = p_sku and i.released_at is not null and i.removed_at is null and o.status in ('paid', 'purchasing', 'awaiting_payment', 'part_paid')
    order by o.paid_at nulls last, i.released_at, i.id
    for update of i
  loop
    update public.order_items set purchased_qty = least(r.qty, left_qty) where id = r.id;
    left_qty := greatest(0, left_qty - r.qty);
    n := n + 1;
  end loop;

  perform set_config('fastchina.note', 'purchasing', true);
  update public.orders o set status = 'purchasing'
  where o.status = 'paid' and exists (select 1 from public.order_items i where i.order_id = o.id and i.purchased_qty > 0);
  update public.orders o set status = 'purchased'
  where o.status = 'purchasing'
    and not exists (select 1 from public.order_items i where i.order_id = o.id and i.removed_at is null and i.purchased_qty < i.qty);
  return n;
end $$;

-- Dispatch one state: every bought order for that state leaves together. The 10-day auto-delivery starts now.
create function public.dispatch_state(p_state text) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform set_config('fastchina.note', 'dispatched with ' || p_state, true);
  update public.orders set status = 'at_warehouse' where state = p_state and status = 'purchased';
  update public.orders set status = 'shipped' where state = p_state and status = 'at_warehouse';
  get diagnostics n = row_count;
  return n;
end $$;

-- Purchase list for staff: what to buy, per variant.
create view public.purchase_list with (security_invoker = true) as
select i.sku_id, p.title, coalesce(k.props_text, '') as variant, p.supplier, k.cny_price, i.ship_mode,
       count(distinct i.order_id)::int as orders, sum(i.qty)::int as need, sum(i.purchased_qty)::int as bought
from public.order_items i
join public.orders o on o.id = i.order_id
join public.product_skus k on k.id = i.sku_id
join public.products p on p.id = k.product_id
where i.released_at is not null and i.removed_at is null and o.status in ('paid', 'purchasing', 'awaiting_payment', 'part_paid')
group by i.sku_id, p.title, k.props_text, p.supplier, k.cny_price, i.ship_mode;

create view public.dispatch_by_state with (security_invoker = true) as
select o.state,
       count(*) filter (where o.status in ('purchased', 'at_warehouse'))::int as ready,
       count(*) filter (where o.status in ('paid', 'purchasing'))::int as waiting,
       count(*) filter (where o.status = 'shipped')::int as shipped,
       coalesce(sum(i.units) filter (where o.status in ('purchased', 'at_warehouse')), 0)::int as units,
       count(distinct o.station_id)::int as stations
from public.orders o
left join lateral (select sum(qty) as units from public.order_items where order_id = o.id and removed_at is null) i on true
where o.status in ('paid', 'purchasing', 'purchased', 'at_warehouse', 'shipped')
group by o.state;

revoke all on public.purchase_list, public.dispatch_by_state from anon, authenticated;
grant select on public.purchase_list, public.dispatch_by_state to service_role;

do $$
declare f text;
begin
  foreach f in array array[
    'public.place_order(uuid, text, text, text, int, int, text, jsonb, int)', 'public.record_purchase(uuid, int)',
    'public.dispatch_state(text)', 'public.release_funded_items(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
grant execute on function public.track_order(text, text) to anon, authenticated;
