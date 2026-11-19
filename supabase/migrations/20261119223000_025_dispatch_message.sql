-- 025: clearer message when an order was already sent; restart PO/DS numbers (test runs used a few).
create or replace function public.stock_dispatch(p_actor uuid, p_carrier text, p_sent_on date, p_extra_cost int, p_note text, p_orders jsonb)
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
    if o.status in ('shipped', 'delivered', 'refunded') then raise exception 'Order % was already sent', o.code; end if;
    if o.status = 'cancelled' then raise exception 'Order % is cancelled', o.code; end if;
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
revoke execute on function public.stock_dispatch(uuid, text, date, integer, text, jsonb) from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from public.purchases) then perform setval('public.purchase_ref_seq', 1, false); end if;
  if not exists (select 1 from public.dispatches) then perform setval('public.dispatch_ref_seq', 1, false); end if;
end $$;
