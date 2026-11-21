-- 1. Purchasing: the buy list carries each product's supplier link, so staff can open it and order.
-- 2. Customisable products: customers upload a logo or artwork after paying; staff quote the
--    customisation, the customer pays it from their account, and the order can't ship until it's paid.
-- 3. Pay small small has no schedule: pay any amount, any time; we order once it's fully paid.
--    Group pay has no deadline, and an order friends have paid into can't be cancelled until it's complete.

-- 1 -------------------------------------------------------------------------------------------
create or replace view public.buy_list with (security_invoker = true) as
  select i.sku_id, p.title, coalesce(k.props_text, ''::text) as variant, p.supplier, k.cny_price,
    (round(coalesce(k.cost_ngn, 0::numeric)))::integer as est_cost_ngn,
    (count(distinct i.order_id))::integer as orders,
    (sum(i.qty))::integer as need,
    (sum(i.purchased_qty))::integer as covered,
    ((sum(i.qty) - sum(i.purchased_qty)))::integer as short,
    bool_or(o.ship_mode = 'sea' or i.ship_mode = 'sea') as sea,
    p.source_url
  from public.order_items i
  join public.orders o on o.id = i.order_id
  join public.product_skus k on k.id = i.sku_id
  join public.products p on p.id = k.product_id
  where i.released_at is not null and i.removed_at is null
    and o.status = any (array['awaiting_payment', 'part_paid', 'paid', 'purchasing', 'purchased', 'at_warehouse'])
  group by i.sku_id, p.title, k.props_text, p.supplier, k.cny_price, k.cost_ngn, p.source_url
  having sum(i.qty) > sum(i.purchased_qty);

-- 2 -------------------------------------------------------------------------------------------
alter table public.products add column if not exists customisable boolean not null default false;
grant select (customisable) on public.products to anon, authenticated;
comment on column public.products.customisable is 'The supplier can print or embroider a customer''s logo or artwork. Billed separately after staff see the artwork.';
update public.products set customisable = true
where jsonb_array_length(coalesce(raw->'customization_options', '[]'::jsonb)) > 0 and not customisable;

alter table public.wallet_ledger drop constraint if exists wallet_ledger_reason_check;
alter table public.wallet_ledger add constraint wallet_ledger_reason_check
  check (reason in ('plan_cancelled', 'group_refund', 'order_refund', 'draw_win', 'spend', 'topup', 'adjustment', 'customisation'));

create table if not exists public.order_customisations (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade unique,
  customer_id uuid references auth.users (id) on delete set null,
  files text[] not null default '{}' check (cardinality(files) between 1 and 6),
  note text check (length(note) <= 600),
  status text not null default 'reviewing' check (status in ('reviewing', 'quoted', 'paid', 'declined')),
  quote_ngn int check (quote_ngn is null or quote_ngn >= 0),
  staff_note text check (length(staff_note) <= 400),
  quoted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists order_customisations_order_idx on public.order_customisations (order_id);
alter table public.order_customisations enable row level security;
drop policy if exists "customisations: owner or staff" on public.order_customisations;
create policy "customisations: owner or staff" on public.order_customisations for select
  using (customer_id = (select auth.uid()) or public.is_staff());
grant select on public.order_customisations to authenticated;

-- Customer sends artwork for a customisable item of their own order, once they've paid something
-- and before it ships. Sending again replaces the artwork and asks for a new quote.
create or replace function public.submit_customisation(p_item uuid, p_files text[], p_note text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare it record; rid bigint;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select i.id, i.order_id, o.status, o.paid_ngn, p.customisable into it
  from public.order_items i join public.orders o on o.id = i.order_id
  join public.product_skus k on k.id = i.sku_id join public.products p on p.id = k.product_id
  where i.id = p_item and o.customer_id = auth.uid();
  if it.id is null then raise exception 'Item not found'; end if;
  if not it.customisable then raise exception 'This item can''t be customised'; end if;
  if it.paid_ngn <= 0 then raise exception 'Pay for your order first, then send your logo'; end if;
  if it.status not in ('part_paid', 'paid', 'purchasing', 'purchased', 'at_warehouse') then raise exception 'This order can''t be customised any more'; end if;
  if coalesce(cardinality(p_files), 0) not between 1 and 6 or exists (select 1 from unnest(p_files) f where f !~ '^https://') then raise exception 'Add 1 to 6 files'; end if;
  if exists (select 1 from public.order_customisations where order_item_id = p_item and status = 'paid') then raise exception 'This customisation is already paid'; end if;
  insert into public.order_customisations (order_id, order_item_id, customer_id, files, note)
  values (it.order_id, p_item, auth.uid(), p_files, nullif(trim(p_note), ''))
  on conflict (order_item_id) do update set files = excluded.files, note = excluded.note, status = 'reviewing',
    quote_ngn = null, quoted_at = null, updated_at = now()
  returning id into rid;
  return rid;
end $$;
revoke execute on function public.submit_customisation(uuid, text[], text) from public, anon;
grant execute on function public.submit_customisation(uuid, text[], text) to authenticated;

-- Customer pays a quote from their FastChina wallet.
create or replace function public.pay_customisation(p_id bigint)
returns text language plpgsql security definer set search_path = '' as $$
declare c public.order_customisations; bal int;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into c from public.order_customisations where id = p_id and customer_id = auth.uid() for update;
  if c.id is null then raise exception 'Not found'; end if;
  if c.status <> 'quoted' then raise exception 'Nothing to pay yet'; end if;
  perform pg_advisory_xact_lock(hashtext('wallet:' || auth.uid()::text));
  select coalesce(sum(amount_ngn), 0) into bal from public.wallet_ledger where customer_id = auth.uid();
  if bal < c.quote_ngn then raise exception 'Your wallet has %. Top up or pay by transfer, and we''ll confirm it.', public.naira_text(bal); end if;
  if c.quote_ngn > 0 then
    insert into public.wallet_ledger (customer_id, amount_ngn, reason, ref_id) values (auth.uid(), -c.quote_ngn, 'customisation', c.order_id);
  end if;
  update public.order_customisations set status = 'paid', paid_at = now(), updated_at = now() where id = c.id;
  return 'paid';
end $$;
revoke execute on function public.pay_customisation(bigint) from public, anon;
grant execute on function public.pay_customisation(bigint) to authenticated;

-- Customers hear when a quote is ready, and when it's paid.
create or replace function public.customisations_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare code text;
begin
  if new.status is not distinct from old.status then return null; end if;
  select o.code into code from public.orders o where o.id = new.order_id;
  if new.status = 'quoted' then
    perform public.notify(new.customer_id, 'order', 'Customisation price ready · #' || code,
      'Your logo has been checked. Customising costs ' || public.naira_text(new.quote_ngn) || '. Pay it from your orders page before we ship.',
      '/account/orders', null, null, 'custom:' || new.id || ':quoted:' || new.quote_ngn);
  elsif new.status = 'paid' then
    perform public.notify(new.customer_id, 'order', 'Customisation paid · #' || code, 'Thanks. Your logo goes to the factory with your order.',
      '/account/orders', null, null, 'custom:' || new.id || ':paid');
  elsif new.status = 'declined' then
    perform public.notify(new.customer_id, 'order', 'We couldn''t use your artwork · #' || code,
      coalesce(new.staff_note, 'Please send a clearer file from your orders page.'), '/account/orders', null, null, 'custom:' || new.id || ':declined:' || extract(epoch from now())::bigint);
  end if;
  return null;
end $$;
drop trigger if exists order_customisations_notify on public.order_customisations;
create trigger order_customisations_notify after update of status on public.order_customisations
  for each row execute function public.customisations_notify();

-- An order with artwork waiting for a price or payment doesn't leave China.
create or replace function public.orders_customisation_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'shipped' and old.status is distinct from 'shipped'
     and exists (select 1 from public.order_customisations c where c.order_id = new.id and c.status in ('reviewing', 'quoted')) then
    raise exception 'Order % has a customisation that isn''t paid yet', new.code using errcode = 'check_violation';
  end if;
  return new;
end $$;
drop trigger if exists orders_customisation_guard on public.orders;
create trigger orders_customisation_guard before update of status on public.orders
  for each row execute function public.orders_customisation_guard();

-- 3 -------------------------------------------------------------------------------------------
-- Pay small small: a plan is just "pay as you go". No instalments, no due dates, no auto-cancel.
alter table public.payment_plans drop constraint if exists payment_plans_weeks_check;
alter table public.payment_plans alter column weeks set default 0;
update public.payment_plans set weeks = 0 where status = 'active';
delete from public.plan_instalments i using public.payment_plans p where p.id = i.plan_id and p.status = 'active';

create or replace function public.create_payment_plan(p_order uuid, p_weeks integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare o public.orders; plan uuid;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null or o.pay_mode <> 'small' or o.status <> 'awaiting_payment' then raise exception 'Order can''t take a plan'; end if;
  if o.total_ngn < 10000 then raise exception 'Pay small small starts from ₦10,000'; end if;
  insert into public.payment_plans (order_id, weeks) values (p_order, 0) returning id into plan;
  return plan;
end $$;

create or replace function public.sweep_payment_plans()
returns integer language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.payment_plans p set status = 'complete'
  from public.orders o where o.id = p.order_id and p.status = 'active' and o.paid_ngn >= o.total_ngn;
  get diagnostics n = row_count;
  return n;
end $$;

-- Group pay: links stay open until the order is fully paid.
alter table public.group_links alter column expires_at set default 'infinity';
update public.group_links set expires_at = 'infinity' where settled_at is null;
select cron.unschedule('fc-group-settle') where exists (select 1 from cron.job where jobname = 'fc-group-settle');

create or replace function public.settle_group_links() returns integer
language sql set search_path = '' as $$ select 0 $$;

create or replace function public.contribute(p_code text, p_amount integer, p_name text, p_customer uuid, p_payment_ref text)
returns table (accepted integer, excess integer, released integer)
language plpgsql security definer set search_path = '' as $$
declare l public.group_links; o public.orders; needed int; took int;
begin
  select * into l from public.group_links where code = upper(p_code);
  if l.id is null then raise exception 'Unknown link'; end if;
  select * into o from public.orders where id = l.order_id for update;
  if exists (select 1 from public.group_contributions where payment_ref = p_payment_ref) then
    return query select 0, 0, 0; return;
  end if;
  needed := o.total_ngn - o.paid_ngn;
  if needed <= 0 or o.status not in ('awaiting_payment', 'part_paid') then
    insert into public.refunds_due (source, ref_id, amount_ngn) values ('group', l.id, p_amount);
    return query select 0, p_amount, 0; return;
  end if;
  took := least(p_amount, needed);
  if took < 500 and took < needed then
    insert into public.refunds_due (source, ref_id, amount_ngn) values ('group', l.id, p_amount);
    return query select 0, p_amount, 0; return;
  end if;
  insert into public.group_contributions (link_id, contributor_name, customer_id, amount_ngn, payment_ref)
  values (l.id, coalesce(nullif(trim(p_name), ''), 'A friend'), p_customer, took, p_payment_ref);
  update public.orders set paid_ngn = paid_ngn + took where id = o.id;
  if p_amount > took then insert into public.refunds_due (source, ref_id, amount_ngn) values ('group', l.id, p_amount - took); end if;
  return query select took, p_amount - took, (select count(*)::int from public.order_items where order_id = o.id and released_at is not null);
end $$;

-- No cancelling a Group pay order once friends have paid into it, until it's fully paid.
create or replace function public.cancel_or_refund(p_order uuid, p_note text)
returns text language plpgsql security definer set search_path = '' as $$
declare o public.orders; target text;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'Unknown order'; end if;
  if o.pay_mode = 'group' and o.paid_ngn > 0 and o.paid_ngn < o.total_ngn then
    raise exception 'Order % has Group pay contributions. It can''t be cancelled until it''s fully paid.', o.code using errcode = 'check_violation';
  end if;
  target := case when o.status = 'shipped' then 'refunded' else 'cancelled' end;
  if not public.order_can_move(o.status, target) then
    raise exception 'Order % is % and can''t be %', o.code, o.status, target using errcode = 'check_violation';
  end if;
  perform set_config('fastchina.note', coalesce(nullif(trim(p_note), ''), 'by staff'), true);
  update public.orders set status = target where id = o.id;
  if o.paid_ngn > 0 then
    if o.customer_id is not null then
      insert into public.wallet_ledger (customer_id, amount_ngn, reason, ref_id) values (o.customer_id, o.paid_ngn, 'order_refund', o.id);
    else
      insert into public.refunds_due (source, ref_id, amount_ngn) values ('order', o.id, o.paid_ngn);
    end if;
  end if;
  update public.payment_plans set status = 'cancelled' where order_id = o.id and status = 'active';
  return target;
end $$;

-- Reminders: no due dates or closing links any more; a gentle weekly nudge for unfinished plans and links.
create or replace function public.queue_reminders() returns integer
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0; today date := (now() at time zone 'Africa/Lagos')::date;
  hr int := extract(hour from now() at time zone 'Africa/Lagos');
begin
  if hr = 10 and extract(isodow from now() at time zone 'Africa/Lagos') = 6 then
    for r in
      select o.id, o.customer_id, o.code, o.paid_ngn, o.total_ngn, o.pay_mode, l.code as link_code
      from public.orders o left join public.group_links l on l.order_id = o.id
      where o.pay_mode in ('small', 'group') and o.status in ('awaiting_payment', 'part_paid') and o.paid_ngn < o.total_ngn
    loop
      perform public.notify(r.customer_id, 'payment',
        case when r.pay_mode = 'small' then 'Keep going on #' || r.code else 'Share your Group pay link again' end,
        public.naira_text(r.total_ngn - r.paid_ngn) || ' left on order #' || r.code || '. Pay any amount, any time; we order it once it''s fully paid.',
        case when r.pay_mode = 'group' then '/c/' || r.link_code else '/track?code=' || r.code end, null, null,
        'nudge:' || r.id || ':' || today);
      n := n + 1;
    end loop;
  end if;

  if extract(hour from now() at time zone 'Africa/Lagos') = 23 and extract(minute from now() at time zone 'Africa/Lagos') >= 25 then
    for r in select customer_id from public.notification_prefs where marketing_email or in_app_marketing loop
      perform public.notify(r.customer_id, 'promo', 'Midnight Drop starts in 30 minutes', 'Prices fall from 12am to 4am tonight. Your saved items are waiting.',
        '/deals', 'midnight_drop', jsonb_build_object('date', today), 'midnight:' || today || ':' || r.customer_id, true);
      n := n + 1;
    end loop;
  end if;
  return n;
end $$;

-- New imports are marked customisable when the supplier lists customisation options. Staff can change it after.
create or replace function public.products_flag_customisable() returns trigger
language plpgsql set search_path = '' as $$
begin
  if jsonb_array_length(coalesce(new.raw->'customization_options', '[]'::jsonb)) > 0 then new.customisable := true; end if;
  return new;
end $$;
drop trigger if exists products_flag_customisable on public.products;
create trigger products_flag_customisable before insert on public.products
  for each row execute function public.products_flag_customisable();
