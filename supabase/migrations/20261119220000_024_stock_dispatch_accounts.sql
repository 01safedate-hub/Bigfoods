-- 024: stock, dispatch and accounts.
--
-- Buy goods      → purchases + purchase_lines (qty, unit cost) + expenses tied to the purchase (freight, clearing…).
--                  The goods are "expected" and are assigned to customers straight away (oldest paid first).
-- Goods arrive   → mark the purchase arrived (enter what was really received). Orders whose goods are all in
--                  become "at warehouse", ready to send.
-- Send out       → a dispatch (Jumia, a date, a cost per order plus any extra cost). Orders become "shipped",
--                  their goods leave stock, and the cost is booked as a local-shipping expense.
-- Not collected  → a return: which order/item, the refund, any return fee, and whether the goods go back to stock
--                  (they are then re-assigned to the next customer waiting for them).
-- Accounts       → accounts_report(from, to): sales, refunds, real landed goods cost, seller share, expenses, profit.
--
-- Assignments for goods that haven't been sent are always re-worked from scratch per variant (allocate_sku),
-- so cancellations, shortfalls and returns all settle themselves. Sent goods are locked and never move.

create sequence public.purchase_ref_seq;
create sequence public.dispatch_ref_seq;

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default 'PO-' || lpad(nextval('public.purchase_ref_seq')::text, 4, '0'),
  kind text not null default 'buy' check (kind in ('buy', 'restock')),
  bought_on date not null default (now() at time zone 'Africa/Lagos')::date,
  supplier text check (length(supplier) <= 120),
  ship_mode text not null default 'air' check (ship_mode in ('air', 'sea', 'local')),
  status text not null default 'expected' check (status in ('expected', 'arrived')),
  arrived_on date,
  note text check (length(note) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index purchases_created_by_idx on public.purchases (created_by);
create index purchases_status_idx on public.purchases (status, bought_on);

create table public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  sku_id uuid not null references public.product_skus (id),
  qty int not null check (qty > 0 and qty <= 100000),
  unit_ngn int not null check (unit_ngn >= 0),
  received_qty int check (received_qty >= 0 and received_qty <= 100000),
  created_at timestamptz not null default now()
);
create index purchase_lines_purchase_idx on public.purchase_lines (purchase_id);
create index purchase_lines_sku_idx on public.purchase_lines (sku_id);

create table public.allocations (
  id bigint generated always as identity primary key,
  line_id uuid not null references public.purchase_lines (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  qty int not null check (qty > 0),
  locked boolean not null default false
);
create index allocations_line_idx on public.allocations (line_id);
create index allocations_item_idx on public.allocations (order_item_id);

create table public.dispatches (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default 'DS-' || lpad(nextval('public.dispatch_ref_seq')::text, 4, '0'),
  sent_on date not null default (now() at time zone 'Africa/Lagos')::date,
  carrier text not null default 'Jumia' check (length(carrier) between 1 and 60),
  state text,
  extra_cost_ngn int not null default 0 check (extra_cost_ngn >= 0),
  note text check (length(note) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index dispatches_created_by_idx on public.dispatches (created_by);
create index dispatches_sent_on_idx on public.dispatches (sent_on);

create table public.dispatch_orders (
  dispatch_id uuid not null references public.dispatches (id) on delete cascade,
  order_id uuid not null unique references public.orders (id),
  ship_cost_ngn int not null default 0 check (ship_cost_ngn >= 0),
  tracking text check (length(tracking) <= 80),
  primary key (dispatch_id, order_id)
);

create table public.order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  order_item_id uuid references public.order_items (id),
  qty int not null check (qty > 0),
  reason text not null check (reason in ('not_collected', 'damaged', 'wrong_item', 'other')),
  refund_ngn int not null default 0 check (refund_ngn >= 0),
  fee_ngn int not null default 0 check (fee_ngn >= 0),
  restocked boolean not null default false,
  note text check (length(note) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_returns_order_idx on public.order_returns (order_id);
create index order_returns_item_idx on public.order_returns (order_item_id);
create index order_returns_created_by_idx on public.order_returns (created_by);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default (now() at time zone 'Africa/Lagos')::date,
  category text not null check (category in ('freight', 'clearing', 'agent', 'local_shipping', 'packaging', 'returns', 'marketing', 'staff', 'rent', 'bank_charges', 'other')),
  amount_ngn int not null check (amount_ngn > 0),
  note text check (length(note) <= 300),
  purchase_id uuid references public.purchases (id) on delete cascade,
  dispatch_id uuid references public.dispatches (id) on delete cascade,
  return_id uuid references public.order_returns (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index expenses_spent_on_idx on public.expenses (spent_on);
create index expenses_purchase_idx on public.expenses (purchase_id);
create index expenses_dispatch_idx on public.expenses (dispatch_id);
create index expenses_return_idx on public.expenses (return_id);
create index expenses_created_by_idx on public.expenses (created_by);

-- Staff read through the admin (server key). Nobody else sees these tables.
do $$
declare t text;
begin
  foreach t in array array['purchases', 'purchase_lines', 'allocations', 'dispatches', 'dispatch_orders', 'order_returns', 'expenses'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy "staff read" on public.%I for select to authenticated using ((select public.is_staff()))', t);
  end loop;
end $$;

-- Returns can come back after the 10-day auto-delivery.
create or replace function public.order_can_move(from_s text, to_s text)
returns boolean language sql immutable set search_path = '' as $$
  select (from_s, to_s) in (
    ('awaiting_payment', 'part_paid'), ('awaiting_payment', 'paid'), ('awaiting_payment', 'cancelled'),
    ('part_paid', 'paid'), ('part_paid', 'cancelled'),
    ('paid', 'purchasing'), ('paid', 'cancelled'),
    ('purchasing', 'purchased'), ('purchasing', 'cancelled'),
    ('purchased', 'at_warehouse'), ('at_warehouse', 'shipped'),
    ('shipped', 'delivered'), ('shipped', 'refunded'), ('delivered', 'refunded'))
$$;

-- Landed cost per unit: what was paid for the item plus its share of the purchase's fees (split by value).
create view public.landed_lines with (security_invoker = on) as
  select l.id as line_id, l.purchase_id, l.sku_id, l.qty, coalesce(l.received_qty, l.qty) as units, l.unit_ngn,
    l.unit_ngn + case
      when f.fees = 0 then 0
      when g.goods > 0 then round(f.fees::numeric * l.unit_ngn / g.goods * l.qty / greatest(coalesce(l.received_qty, l.qty), 1))::int
      else round(f.fees::numeric / g.units / greatest(coalesce(l.received_qty, l.qty), 1) * l.qty)::int
    end as landed_ngn
  from public.purchase_lines l
  cross join lateral (select coalesce(sum(e.amount_ngn), 0) as fees from public.expenses e where e.purchase_id = l.purchase_id) f
  cross join lateral (select sum(x.unit_ngn::numeric * x.qty) as goods, sum(x.qty) as units from public.purchase_lines x where x.purchase_id = l.purchase_id) g;

-- How far each open order is: units ordered, assigned from purchases, and assigned from goods already here.
create view public.order_readiness with (security_invoker = on) as
  select o.id as order_id,
    coalesce(sum(i.qty), 0)::int as units,
    coalesce(sum(least(i.qty, a.assigned)), 0)::int as assigned,
    coalesce(sum(least(i.qty, a.arrived)), 0)::int as arrived
  from public.orders o
  join public.order_items i on i.order_id = o.id and i.removed_at is null
  left join lateral (
    select coalesce(sum(al.qty), 0) as assigned, coalesce(sum(al.qty) filter (where p.status = 'arrived'), 0) as arrived
    from public.allocations al join public.purchase_lines l on l.id = al.line_id join public.purchases p on p.id = l.purchase_id
    where al.order_item_id = i.id
  ) a on true
  group by o.id;

-- Moves orders forward as their goods are bought and arrive (the order trigger keeps the history and notifies).
create function public.advance_orders(p_orders uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('fastchina.note', 'stock update', true);
  update public.orders o set status = 'purchasing'
  where o.id = any (p_orders) and o.status = 'paid'
    and exists (select 1 from public.order_readiness r where r.order_id = o.id and r.assigned > 0);
  update public.orders o set status = 'purchased'
  where o.id = any (p_orders) and o.status = 'purchasing'
    and exists (select 1 from public.order_readiness r where r.order_id = o.id and r.assigned >= r.units);
  update public.orders o set status = 'at_warehouse'
  where o.id = any (p_orders) and o.status = 'purchased'
    and exists (select 1 from public.order_readiness r where r.order_id = o.id and r.arrived >= r.units);
end $$;

-- Re-works who gets which units of one variant. Goods already here go first, to the customers who paid first.
create function public.allocate_sku(p_sku uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare ids uuid[]; lefts int[]; i int := 1; n int; it record; need int; take int; assigned int := 0; touched uuid[];
begin
  perform pg_advisory_xact_lock(hashtext('fastchina.alloc:' || p_sku::text));
  delete from public.allocations a using public.purchase_lines l where a.line_id = l.id and l.sku_id = p_sku and not a.locked;

  select coalesce(array_agg(x.id order by x.arrived desc, x.bought_on, x.created_at), '{}'), coalesce(array_agg(x.left_qty order by x.arrived desc, x.bought_on, x.created_at), '{}')
  into ids, lefts
  from (
    select l.id, p.status = 'arrived' as arrived, p.bought_on, l.created_at,
      coalesce(l.received_qty, l.qty) - coalesce((select sum(a.qty) from public.allocations a where a.line_id = l.id), 0) as left_qty
    from public.purchase_lines l join public.purchases p on p.id = l.purchase_id
    where l.sku_id = p_sku
  ) x where x.left_qty > 0;
  n := coalesce(array_length(ids, 1), 0);

  for it in
    select oi.id, oi.qty - coalesce((select sum(a.qty) from public.allocations a where a.order_item_id = oi.id), 0) as need
    from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.sku_id = p_sku and oi.released_at is not null and oi.removed_at is null
      and o.status in ('awaiting_payment', 'part_paid', 'paid', 'purchasing', 'purchased', 'at_warehouse')
    order by o.paid_at nulls last, oi.released_at, oi.id
  loop
    need := it.need;
    while need > 0 and i <= n loop
      take := least(need, lefts[i]);
      insert into public.allocations (line_id, order_item_id, qty) values (ids[i], it.id, take);
      need := need - take; lefts[i] := lefts[i] - take; assigned := assigned + take;
      if lefts[i] = 0 then i := i + 1; end if;
    end loop;
  end loop;

  update public.order_items oi set purchased_qty = s.q
  from (select oi2.id, coalesce((select sum(a.qty) from public.allocations a where a.order_item_id = oi2.id), 0)::int as q
        from public.order_items oi2 where oi2.sku_id = p_sku) s
  where oi.id = s.id and oi.purchased_qty is distinct from s.q;

  select array_agg(distinct oi.order_id) into touched from public.order_items oi where oi.sku_id = p_sku;
  if touched is not null then perform public.advance_orders(touched); end if;
  return assigned;
end $$;

-- Newly paid items take spare stock; cancelled orders hand theirs back.
create function public.stock_on_item_release()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.released_at is not null and old.released_at is null and new.sku_id is not null
     and exists (select 1 from public.purchase_lines l where l.sku_id = new.sku_id) then
    perform public.allocate_sku(new.sku_id);
  end if;
  return null;
end $$;
create trigger order_items_stock after update of released_at on public.order_items
  for each row execute function public.stock_on_item_release();

create function public.stock_on_order_cancel()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s uuid;
begin
  if new.status in ('cancelled', 'refunded') and old.status is distinct from new.status then
    for s in select distinct i.sku_id from public.order_items i join public.allocations a on a.order_item_id = i.id where i.order_id = new.id and not a.locked loop
      perform public.allocate_sku(s);
    end loop;
  end if;
  return null;
end $$;
create trigger orders_stock after update of status on public.orders
  for each row execute function public.stock_on_order_cancel();

revoke execute on function public.stock_on_item_release(), public.stock_on_order_cancel() from public, anon, authenticated;

-- 1. Record a purchase. p_lines: [{sku_id, qty, unit_ngn}], p_fees: [{category, amount_ngn, note}].
create function public.stock_record_purchase(p_actor uuid, p_supplier text, p_ship_mode text, p_bought_on date, p_note text, p_lines jsonb, p_fees jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare pid uuid; pref text; s uuid; total int := 0; units int;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'Add at least one product'; end if;
  insert into public.purchases (supplier, ship_mode, bought_on, note, created_by)
  values (nullif(trim(p_supplier), ''), coalesce(p_ship_mode, 'air'), coalesce(p_bought_on, (now() at time zone 'Africa/Lagos')::date), nullif(trim(p_note), ''), p_actor)
  returning id, ref into pid, pref;
  insert into public.purchase_lines (purchase_id, sku_id, qty, unit_ngn)
  select pid, (l->>'sku_id')::uuid, (l->>'qty')::int, (l->>'unit_ngn')::int from jsonb_array_elements(p_lines) l;
  insert into public.expenses (spent_on, category, amount_ngn, note, purchase_id, created_by)
  select coalesce(p_bought_on, (now() at time zone 'Africa/Lagos')::date), f->>'category', (f->>'amount_ngn')::int, nullif(trim(f->>'note'), ''), pid, p_actor
  from jsonb_array_elements(coalesce(p_fees, '[]')) f where coalesce((f->>'amount_ngn')::int, 0) > 0;
  for s in select distinct sku_id from public.purchase_lines where purchase_id = pid loop
    total := total + public.allocate_sku(s);
  end loop;
  select sum(qty) into units from public.purchase_lines where purchase_id = pid;
  return jsonb_build_object('id', pid, 'ref', pref, 'units', units,
    'assigned', (select coalesce(sum(a.qty), 0) from public.allocations a join public.purchase_lines l on l.id = a.line_id where l.purchase_id = pid),
    'customers', (select count(distinct oi.order_id) from public.allocations a join public.purchase_lines l on l.id = a.line_id join public.order_items oi on oi.id = a.order_item_id where l.purchase_id = pid));
end $$;

-- 2. Goods arrived. p_received: {line_id: qty} for any line that came short or over; others = as bought.
create function public.stock_mark_arrived(p_purchase uuid, p_received jsonb, p_on date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s uuid; p public.purchases;
begin
  select * into p from public.purchases where id = p_purchase for update;
  if p.id is null then raise exception 'Unknown purchase'; end if;
  if p.status = 'arrived' then raise exception '% is already marked arrived', p.ref; end if;
  update public.purchase_lines l set received_qty = coalesce((p_received->>(l.id::text))::int, l.qty) where l.purchase_id = p.id;
  update public.purchases set status = 'arrived', arrived_on = coalesce(p_on, (now() at time zone 'Africa/Lagos')::date) where id = p.id;
  for s in select distinct sku_id from public.purchase_lines where purchase_id = p.id loop perform public.allocate_sku(s); end loop;
  return jsonb_build_object('ref', p.ref,
    'ready', (select count(*) from public.orders o join public.order_readiness r on r.order_id = o.id where o.status = 'at_warehouse' and r.arrived >= r.units));
end $$;

-- 3. Send orders out. p_orders: [{order_id, cost_ngn, tracking}]. Only orders with every unit here can go.
create function public.stock_dispatch(p_actor uuid, p_carrier text, p_sent_on date, p_extra_cost int, p_note text, p_orders jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare did uuid; dref text; o record; n int := 0; states text[]; cost int;
begin
  if jsonb_typeof(p_orders) <> 'array' or jsonb_array_length(p_orders) = 0 then raise exception 'Pick at least one order'; end if;
  for o in
    select x.order_id, ord.code, ord.status, r.units, r.arrived
    from jsonb_to_recordset(p_orders) as x(order_id uuid, cost_ngn int, tracking text)
    left join public.orders ord on ord.id = x.order_id left join public.order_readiness r on r.order_id = x.order_id
  loop
    if o.code is null then raise exception 'Unknown order'; end if;
    if o.status <> 'at_warehouse' or coalesce(o.arrived, 0) < coalesce(o.units, 1) then
      raise exception 'Order % isn''t complete yet (% of % units here)', o.code, coalesce(o.arrived, 0), coalesce(o.units, 0);
    end if;
  end loop;

  select array_agg(distinct ord.state) into states from public.orders ord where ord.id in (select (e->>'order_id')::uuid from jsonb_array_elements(p_orders) e);
  insert into public.dispatches (sent_on, carrier, state, extra_cost_ngn, note, created_by)
  values (coalesce(p_sent_on, (now() at time zone 'Africa/Lagos')::date), coalesce(nullif(trim(p_carrier), ''), 'Jumia'),
          case when array_length(states, 1) = 1 then states[1] else 'Several states' end, greatest(coalesce(p_extra_cost, 0), 0), nullif(trim(p_note), ''), p_actor)
  returning id, ref into did, dref;
  insert into public.dispatch_orders (dispatch_id, order_id, ship_cost_ngn, tracking)
  select did, x.order_id, greatest(coalesce(x.cost_ngn, 0), 0), nullif(trim(x.tracking), '') from jsonb_to_recordset(p_orders) as x(order_id uuid, cost_ngn int, tracking text);

  update public.allocations a set locked = true
  from public.order_items i where a.order_item_id = i.id and i.order_id in (select order_id from public.dispatch_orders where dispatch_id = did);
  perform set_config('fastchina.note', 'sent with ' || dref, true);
  update public.orders set status = 'shipped' where id in (select order_id from public.dispatch_orders where dispatch_id = did);
  get diagnostics n = row_count;

  select coalesce(sum(ship_cost_ngn), 0) + greatest(coalesce(p_extra_cost, 0), 0) into cost from public.dispatch_orders where dispatch_id = did;
  if cost > 0 then
    insert into public.expenses (spent_on, category, amount_ngn, note, dispatch_id, created_by)
    values (coalesce(p_sent_on, (now() at time zone 'Africa/Lagos')::date), 'local_shipping', cost, dref || ' · ' || n || ' orders', did, p_actor);
  end if;
  return jsonb_build_object('ref', dref, 'orders', n, 'cost', cost);
end $$;

-- 4. A customer didn't collect (or sent it back). Whole order when p_item is null.
create function public.stock_record_return(p_actor uuid, p_order uuid, p_item uuid, p_qty int, p_reason text, p_refund int, p_fee int, p_restock boolean, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; it public.order_items; rid uuid; refunded int; q int; pid uuid; r record;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'Unknown order'; end if;
  if o.status not in ('shipped', 'delivered', 'refunded') then raise exception 'Order % hasn''t been sent yet. Cancel it from Orders instead.', o.code; end if;
  if p_item is not null then
    select * into it from public.order_items where id = p_item and order_id = o.id;
    if it.id is null then raise exception 'That item isn''t on order %', o.code; end if;
    q := least(greatest(coalesce(p_qty, it.qty), 1), it.qty);
  else
    q := (select coalesce(sum(qty), 0) from public.order_items where order_id = o.id and removed_at is null);
  end if;
  select coalesce(sum(refund_ngn), 0) into refunded from public.order_returns where order_id = o.id;
  if coalesce(p_refund, 0) + refunded > o.paid_ngn then
    raise exception 'Refund too big: order % paid %, already refunded %', o.code, o.paid_ngn, refunded;
  end if;

  insert into public.order_returns (order_id, order_item_id, qty, reason, refund_ngn, fee_ngn, restocked, note, created_by)
  values (o.id, p_item, q, coalesce(p_reason, 'not_collected'), greatest(coalesce(p_refund, 0), 0), greatest(coalesce(p_fee, 0), 0), coalesce(p_restock, false), nullif(trim(p_note), ''), p_actor)
  returning id into rid;

  if coalesce(p_refund, 0) > 0 then
    if o.customer_id is not null then
      insert into public.wallet_ledger (customer_id, amount_ngn, reason, ref_id) values (o.customer_id, p_refund, 'order_refund', o.id);
    else
      insert into public.refunds_due (source, ref_id, amount_ngn) values ('order', o.id, p_refund);
    end if;
  end if;
  if coalesce(p_fee, 0) > 0 then
    insert into public.expenses (category, amount_ngn, note, return_id, created_by) values ('returns', p_fee, 'Return fee · #' || o.code, rid, p_actor);
  end if;

  if coalesce(p_restock, false) then
    insert into public.purchases (kind, supplier, ship_mode, status, arrived_on, note, created_by)
    values ('restock', 'Returned stock', 'local', 'arrived', (now() at time zone 'Africa/Lagos')::date, 'Back from #' || o.code, p_actor)
    returning id into pid;
    for r in
      select i.sku_id, case when p_item is null then i.qty else q end as units,
        coalesce((select round(sum(a.qty * ll.landed_ngn)::numeric / nullif(sum(a.qty), 0))::int from public.allocations a join public.landed_lines ll on ll.line_id = a.line_id where a.order_item_id = i.id), i.cost_ngn, 0) as unit_cost
      from public.order_items i where i.order_id = o.id and i.removed_at is null and (p_item is null or i.id = p_item) and i.sku_id is not null
    loop
      insert into public.purchase_lines (purchase_id, sku_id, qty, unit_ngn, received_qty) values (pid, r.sku_id, r.units, greatest(r.unit_cost, 0), r.units);
    end loop;
  end if;

  if p_item is null and o.status in ('shipped', 'delivered') then
    perform set_config('fastchina.note', coalesce(nullif(trim(p_note), ''), 'not collected'), true);
    update public.orders set status = 'refunded' where id = o.id;
  end if;
  if pid is not null then
    for r in select distinct sku_id from public.purchase_lines where purchase_id = pid loop perform public.allocate_sku(r.sku_id); end loop;
  end if;
  return jsonb_build_object('code', o.code, 'units', q, 'refund', coalesce(p_refund, 0));
end $$;

-- 5. Stock per variant.
create view public.stock_levels with (security_invoker = on) as
  select k.id as sku_id, p.title, coalesce(k.props_text, '') as variant, p.slug,
    coalesce(sum(case when pu.status = 'expected' then l.qty end), 0)::int as expected,
    coalesce(sum(case when pu.status = 'arrived' then coalesce(l.received_qty, l.qty) end), 0)::int
      - coalesce((select sum(a.qty) from public.allocations a join public.purchase_lines l2 on l2.id = a.line_id where l2.sku_id = k.id and a.locked), 0)::int as on_hand,
    coalesce((select sum(a.qty) from public.allocations a join public.purchase_lines l2 on l2.id = a.line_id join public.purchases p2 on p2.id = l2.purchase_id
              where l2.sku_id = k.id and not a.locked and p2.status = 'arrived'), 0)::int as on_hand_assigned,
    coalesce((select sum(a.qty) from public.allocations a join public.purchase_lines l2 on l2.id = a.line_id join public.purchases p2 on p2.id = l2.purchase_id
              where l2.sku_id = k.id and not a.locked and p2.status = 'expected'), 0)::int as expected_assigned,
    coalesce((select sum(a.qty) from public.allocations a join public.purchase_lines l2 on l2.id = a.line_id where l2.sku_id = k.id and a.locked), 0)::int as sent,
    coalesce((select sum(i.qty - i.purchased_qty) from public.order_items i join public.orders o on o.id = i.order_id
              where i.sku_id = k.id and i.released_at is not null and i.removed_at is null
                and o.status in ('awaiting_payment', 'part_paid', 'paid', 'purchasing', 'purchased', 'at_warehouse')), 0)::int as short,
    coalesce(round(sum(ll.landed_ngn::numeric * ll.units) filter (where pu.status = 'arrived') / nullif(sum(ll.units) filter (where pu.status = 'arrived'), 0)), 0)::int as avg_landed_ngn
  from public.product_skus k
  join public.products p on p.id = k.product_id
  join public.purchase_lines l on l.sku_id = k.id
  join public.purchases pu on pu.id = l.purchase_id
  join public.landed_lines ll on ll.line_id = l.id
  group by k.id, p.title, k.props_text, p.slug;

-- What still has to be bought: paid demand per variant not yet covered by any purchase.
create view public.buy_list with (security_invoker = on) as
  select i.sku_id, p.title, coalesce(k.props_text, '') as variant, p.supplier, k.cny_price, round(coalesce(k.cost_ngn, 0))::int as est_cost_ngn,
    count(distinct i.order_id)::int as orders, sum(i.qty)::int as need, sum(i.purchased_qty)::int as covered,
    (sum(i.qty) - sum(i.purchased_qty))::int as short,
    bool_or(o.ship_mode = 'sea' or i.ship_mode = 'sea') as sea
  from public.order_items i
  join public.orders o on o.id = i.order_id
  join public.product_skus k on k.id = i.sku_id
  join public.products p on p.id = k.product_id
  where i.released_at is not null and i.removed_at is null
    and o.status in ('awaiting_payment', 'part_paid', 'paid', 'purchasing', 'purchased', 'at_warehouse')
  group by i.sku_id, p.title, k.props_text, p.supplier, k.cny_price, k.cost_ngn
  having sum(i.qty) > sum(i.purchased_qty);

-- 6. Accounts for a period (Lagos dates). Sales are orders fully paid in the period; goods cost is the real
--    landed cost of the units assigned to them (estimated cost for anything not bought yet).
create function public.accounts_report(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with ord as (
    select o.* from public.orders o
    where o.paid_at is not null and (o.paid_at at time zone 'Africa/Lagos')::date between p_from and p_to
  ),
  items as (
    select i.*, o.status as order_status,
      coalesce((select sum(a.qty * ll.landed_ngn) from public.allocations a join public.landed_lines ll on ll.line_id = a.line_id where a.order_item_id = i.id), 0) as actual,
      coalesce((select sum(a.qty) from public.allocations a where a.order_item_id = i.id), 0) as covered
    from public.order_items i join ord o on o.id = i.order_id where i.removed_at is null
  ),
  exp as (select * from public.expenses e where e.spent_on between p_from and p_to),
  refunds as (
    select coalesce((select sum(w.amount_ngn) from public.wallet_ledger w where w.reason = 'order_refund' and (w.created_at at time zone 'Africa/Lagos')::date between p_from and p_to), 0)
         + coalesce((select sum(r.amount_ngn) from public.refunds_due r where r.source = 'order' and (r.created_at at time zone 'Africa/Lagos')::date between p_from and p_to), 0) as total
  ),
  restocked as (
    select coalesce(sum(l.qty::bigint * l.unit_ngn), 0) as total from public.purchase_lines l join public.purchases p on p.id = l.purchase_id
    where p.kind = 'restock' and p.arrived_on between p_from and p_to
  ),
  goods as (
    select coalesce(sum(actual), 0) as actual,
      coalesce(sum(greatest(qty - covered, 0) * cost_ngn) filter (where order_status not in ('cancelled')), 0) as estimated,
      coalesce(sum(store_markup_ngn * qty) filter (where order_status not in ('cancelled', 'refunded')), 0) as seller_markup
    from items
  ),
  seller as (
    select coalesce(sum(e.net_ngn) filter (where e.bucket <> 'void'), 0) as net from public.store_earnings_all e where e.order_id in (select id from ord)
  ),
  spend as (
    select coalesce(sum(l.qty::bigint * l.unit_ngn), 0) as goods,
      coalesce((select sum(e.amount_ngn) from public.expenses e join public.purchases p2 on p2.id = e.purchase_id where p2.bought_on between p_from and p_to), 0) as fees,
      count(distinct p.id) as purchases
    from public.purchases p join public.purchase_lines l on l.purchase_id = p.id
    where p.kind = 'buy' and p.bought_on between p_from and p_to
  ),
  stock as (
    select coalesce(sum(s.on_hand::bigint * s.avg_landed_ngn), 0) as on_hand_value, coalesce(sum(s.on_hand), 0) as on_hand_units,
      coalesce(sum(s.expected), 0) as expected_units
    from public.stock_levels s
  )
  select jsonb_build_object(
    'from', p_from, 'to', p_to,
    'orders', (select count(*) from ord),
    'sales', (select coalesce(sum(total_ngn), 0) from ord),
    'wholesale_sales', (select coalesce(sum(total_ngn), 0) from ord where channel = 'wholesale'),
    'refunds', (select total from refunds),
    'goods_actual', (select actual from goods),
    'goods_estimated', (select estimated from goods),
    'restocked', (select total from restocked),
    'seller_share', (select net from seller),
    'shipping_out', (select coalesce(sum(amount_ngn), 0) from exp where category = 'local_shipping' and purchase_id is null),
    'returns_fees', (select coalesce(sum(amount_ngn), 0) from exp where category = 'returns' and purchase_id is null),
    'other_expenses', (select coalesce(sum(amount_ngn), 0) from exp where purchase_id is null and category not in ('local_shipping', 'returns')),
    'expenses_by_category', (select coalesce(jsonb_object_agg(category, amt), '{}') from (select category, sum(amount_ngn) as amt from exp where purchase_id is null group by category) x),
    'purchase_fees_by_category', (select coalesce(jsonb_object_agg(category, amt), '{}') from (select category, sum(amount_ngn) as amt from exp where purchase_id is not null group by category) x),
    'spend_goods', (select goods from spend), 'spend_fees', (select fees from spend), 'purchases', (select purchases from spend),
    'shipped_orders', (select count(*) from public.dispatch_orders d join public.dispatches ds on ds.id = d.dispatch_id where ds.sent_on between p_from and p_to),
    'returns', (select count(*) from public.order_returns r where (r.created_at at time zone 'Africa/Lagos')::date between p_from and p_to),
    'refunds_pending', (select coalesce(sum(amount_ngn), 0) from public.refunds_due where status = 'pending'),
    'stock_value', (select on_hand_value from stock), 'stock_units', (select on_hand_units from stock), 'expected_units', (select expected_units from stock)
  )
$$;

-- The old one-number purchase and whole-state dispatch are replaced by the functions above (kept, server-only, unused).
revoke execute on function public.record_purchase(uuid, integer) from public, anon, authenticated;
revoke execute on function public.dispatch_state(text) from public, anon, authenticated;

-- Server only.
do $$
declare f text;
begin
  foreach f in array array[
    'public.advance_orders(uuid[])', 'public.allocate_sku(uuid)',
    'public.stock_record_purchase(uuid, text, text, date, text, jsonb, jsonb)', 'public.stock_mark_arrived(uuid, jsonb, date)',
    'public.stock_dispatch(uuid, text, date, integer, text, jsonb)', 'public.stock_record_return(uuid, uuid, uuid, integer, text, integer, integer, boolean, text)',
    'public.accounts_report(date, date)'] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
do $$
declare v text;
begin
  foreach v in array array['landed_lines', 'order_readiness', 'stock_levels', 'buy_list'] loop
    execute format('revoke all on public.%I from anon, authenticated', v);
  end loop;
end $$;
