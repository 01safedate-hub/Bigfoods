-- 008: the five automations behind orders and promotions.
--   1. Orders: status machine enforced by trigger, event log, auto-delivery 10 days after shipping
--   2. Pay small small: exact instalment schedules, daily sweep cancels plans 14 days overdue (refund to wallet)
--   3. Group pay: capped contributions with row locks, items released as funded, expiry refunds pro rata
--   4. Cart Clear-Out: commit-reveal draw, budget = 5% of last week's profit (max ₦500,000)
--   5. Profit guard: hourly worst-case check per variant; pauses discounts or stops selling automatically
-- Money-moving functions are server-only (service role). Mirrors src/lib/{orders,payments,draw,pricing/audit}.ts.

create extension if not exists pg_cron;
create extension if not exists pgcrypto with schema extensions;

-- Wallet ------------------------------------------------------------------------
create table public.wallet_ledger (
  id bigint generated always as identity primary key,
  customer_id uuid not null references auth.users (id) on delete cascade,
  amount_ngn int not null check (amount_ngn <> 0),
  reason text not null check (reason in ('plan_cancelled', 'group_refund', 'order_refund', 'draw_win', 'spend', 'topup', 'adjustment')),
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index wallet_ledger_customer_idx on public.wallet_ledger (customer_id, created_at desc);
alter table public.wallet_ledger enable row level security;
create policy "wallet: own or staff" on public.wallet_ledger for select using (customer_id = auth.uid() or public.is_staff());
grant select on public.wallet_ledger to authenticated;

-- Refunds owed to guests (paid back through the payment provider) ----------------
create table public.refunds_due (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('group', 'order')),
  ref_id uuid not null,
  amount_ngn int not null check (amount_ngn > 0),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);
alter table public.refunds_due enable row level security;
create policy "refunds: staff" on public.refunds_due for select using (public.is_staff());
grant select on public.refunds_due to authenticated;

-- 1. Orders ----------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  customer_id uuid references auth.users (id) on delete set null,
  station_id text not null references public.pickup_stations (id),
  state text not null,                                   -- copied from the station: dispatch runs state by state
  pay_mode text not null check (pay_mode in ('full', 'small', 'group')),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'part_paid', 'paid', 'purchasing', 'purchased', 'at_warehouse', 'shipped', 'delivered', 'cancelled', 'refunded')),
  total_ngn int not null check (total_ngn > 0),
  paid_ngn int not null default 0 check (paid_ngn >= 0),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  check (paid_ngn <= total_ngn)
);
create index orders_status_state_idx on public.orders (status, state);
create index orders_customer_idx on public.orders (customer_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sku_id uuid references public.product_skus (id) on delete set null,
  title text not null,
  variant_label text,
  qty int not null check (qty > 0),
  unit_ngn int not null check (unit_ngn > 0),
  cost_ngn int not null default 0,                       -- snapshot at checkout; staff only
  ship_mode text not null check (ship_mode in ('air', 'sea')),
  priority int not null default 0,                       -- group pay funds items in this order
  released_at timestamptz,                               -- fully paid: goes on the purchasing list
  removed_at timestamptz,                                -- dropped when a group link expired short
  purchased_qty int not null default 0 check (purchased_qty >= 0)
);
create index order_items_order_idx on public.order_items (order_id, priority);
create index order_items_to_buy_idx on public.order_items (released_at) where removed_at is null;

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  by_user uuid,
  note text,
  at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, at);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
create policy "orders: own or staff" on public.orders for select using (customer_id = auth.uid() or public.is_staff());
create policy "orders: staff update" on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy "items: own or staff" on public.order_items for select
  using (public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "items: staff update" on public.order_items for update using (public.is_staff()) with check (public.is_staff());
create policy "events: own or staff" on public.order_events for select
  using (public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
grant select on public.orders, public.order_events to authenticated;
grant update (status) on public.orders to authenticated;
grant select (id, order_id, sku_id, title, variant_label, qty, unit_ngn, ship_mode, priority, released_at, removed_at, purchased_qty)
  on public.order_items to authenticated;
grant update (purchased_qty) on public.order_items to authenticated;

create function public.order_can_move(from_s text, to_s text) returns boolean
language sql immutable set search_path = '' as $$
  select (from_s, to_s) in (
    ('awaiting_payment', 'part_paid'), ('awaiting_payment', 'paid'), ('awaiting_payment', 'cancelled'),
    ('part_paid', 'paid'), ('part_paid', 'cancelled'),
    ('paid', 'purchasing'), ('paid', 'cancelled'),
    ('purchasing', 'purchased'), ('purchasing', 'cancelled'),
    ('purchased', 'at_warehouse'), ('at_warehouse', 'shipped'),
    ('shipped', 'delivered'), ('shipped', 'refunded'))
$$;

-- Releases items to purchasing, top priority first, while the money paid covers them.
create function public.release_funded_items(p_order uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with ranked as (
    select i.id, sum(i.unit_ngn * i.qty) over (order by i.priority, i.id) as running
    from public.order_items i where i.order_id = p_order and i.removed_at is null
  )
  update public.order_items i set released_at = now()
  from ranked r, public.orders o
  where i.id = r.id and o.id = p_order and i.released_at is null and r.running <= o.paid_ngn;
  get diagnostics n = row_count;
  return n;
end $$;

create function public.orders_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Payments move the status by themselves.
  if new.paid_ngn is distinct from old.paid_ngn and new.status = old.status and old.status in ('awaiting_payment', 'part_paid') then
    new.status := case when new.paid_ngn >= new.total_ngn then 'paid' when new.paid_ngn > 0 then 'part_paid' else old.status end;
  end if;
  if new.status is distinct from old.status then
    if not public.order_can_move(old.status, new.status) then
      raise exception 'Order % can''t go from % to %', old.code, old.status, new.status using errcode = 'check_violation';
    end if;
    if new.status = 'purchasing' and new.paid_ngn < new.total_ngn then
      raise exception 'Order % isn''t fully paid', old.code using errcode = 'check_violation';
    end if;
    case new.status
      when 'paid' then new.paid_at := now();
      when 'shipped' then new.shipped_at := now();
      when 'delivered' then new.delivered_at := now();
      when 'cancelled' then new.cancelled_at := now();
      else null;
    end case;
    insert into public.order_events (order_id, from_status, to_status, by_user, note)
    values (new.id, old.status, new.status, auth.uid(), current_setting('fastchina.note', true));
  end if;
  return new;
end $$;
create trigger orders_guard before update on public.orders for each row execute function public.orders_guard();

create function public.orders_after_paid() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.paid_ngn > old.paid_ngn then perform public.release_funded_items(new.id); end if;
  return null;
end $$;
create trigger orders_after_paid after update of paid_ngn on public.orders for each row execute function public.orders_after_paid();

-- Shipped orders become delivered 10 days later.
create function public.auto_deliver_orders() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform set_config('fastchina.note', 'auto: 10 days after shipping', true);
  update public.orders set status = 'delivered' where status = 'shipped' and shipped_at <= now() - interval '10 days';
  get diagnostics n = row_count;
  return n;
end $$;

-- 2. Pay small small ---------------------------------------------------------------
create table public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  weeks int not null check (weeks in (4, 8, 12)),
  status text not null default 'active' check (status in ('active', 'complete', 'cancelled')),
  started_at timestamptz not null default now()
);
create table public.plan_instalments (
  plan_id uuid not null references public.payment_plans (id) on delete cascade,
  n int not null check (n > 0),
  due_at timestamptz not null,
  amount_ngn int not null check (amount_ngn > 0),
  primary key (plan_id, n)
);
alter table public.payment_plans enable row level security;
alter table public.plan_instalments enable row level security;
create policy "plans: own or staff" on public.payment_plans for select
  using (public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "instalments: own or staff" on public.plan_instalments for select
  using (public.is_staff() or exists (select 1 from public.payment_plans p join public.orders o on o.id = p.order_id where p.id = plan_id and o.customer_id = auth.uid()));
grant select on public.payment_plans, public.plan_instalments to authenticated;

-- First payment carries the rounding; later ones are round ₦100 amounts; the sum is exact.
create function public.create_payment_plan(p_order uuid, p_weeks int) returns uuid
language plpgsql security definer set search_path = '' as $$
declare o public.orders; base int; plan uuid;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null or o.pay_mode <> 'small' or o.status <> 'awaiting_payment' then raise exception 'Order can''t take a plan'; end if;
  base := floor(o.total_ngn::numeric / p_weeks / 100) * 100;
  if o.total_ngn < 10000 or base < 2000 then raise exception 'Order too small for % weeks', p_weeks; end if;
  insert into public.payment_plans (order_id, weeks) values (p_order, p_weeks) returning id into plan;
  insert into public.plan_instalments (plan_id, n, due_at, amount_ngn)
  select plan, k, now() + (k - 1) * interval '7 days', case when k = 1 then o.total_ngn - base * (p_weeks - 1) else base end
  from generate_series(1, p_weeks) k;
  return plan;
end $$;

-- Daily: complete paid plans; cancel plans with money overdue 14+ days and return what was paid to the wallet.
create function public.sweep_payment_plans() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  update public.payment_plans p set status = 'complete'
  from public.orders o where o.id = p.order_id and p.status = 'active' and o.paid_ngn >= o.total_ngn;

  for r in
    select p.id as plan_id, o.id as order_id, o.customer_id, o.paid_ngn
    from public.payment_plans p join public.orders o on o.id = p.order_id
    where p.status = 'active' and o.status in ('awaiting_payment', 'part_paid')
      and exists (
        select 1 from (
          select i.due_at, sum(i.amount_ngn) over (order by i.n) as cum from public.plan_instalments i where i.plan_id = p.id
        ) s where s.cum > o.paid_ngn and s.due_at <= now() - interval '14 days')
    for update of p, o
  loop
    perform set_config('fastchina.note', 'auto: plan 14 days overdue', true);
    update public.orders set status = 'cancelled' where id = r.order_id;
    update public.payment_plans set status = 'cancelled' where id = r.plan_id;
    if r.paid_ngn > 0 then
      if r.customer_id is not null then
        insert into public.wallet_ledger (customer_id, amount_ngn, reason, ref_id) values (r.customer_id, r.paid_ngn, 'plan_cancelled', r.order_id);
      else
        insert into public.refunds_due (source, ref_id, amount_ngn) values ('order', r.order_id, r.paid_ngn);
      end if;
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- 3. Group pay -------------------------------------------------------------------
create table public.group_links (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  settled_at timestamptz
);
create table public.group_contributions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.group_links (id) on delete cascade,
  contributor_name text not null default 'A friend' check (char_length(contributor_name) <= 40),
  customer_id uuid references auth.users (id) on delete set null,
  amount_ngn int not null check (amount_ngn > 0),
  payment_ref text unique,                              -- provider reference: a payment is counted once
  created_at timestamptz not null default now()
);
create index group_contributions_link_idx on public.group_contributions (link_id, created_at);
alter table public.group_links enable row level security;
alter table public.group_contributions enable row level security;
create policy "links: owner or staff" on public.group_links for select
  using (public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "contributions: owner or staff" on public.group_contributions for select
  using (public.is_staff() or customer_id = auth.uid());
grant select on public.group_links, public.group_contributions to authenticated;

-- Called by the server after the payment provider confirms a payment. Locks the order so two
-- people paying at once can't over-fund it; accepts at most what's still needed.
create function public.contribute(p_code text, p_amount int, p_name text, p_customer uuid, p_payment_ref text)
returns table (accepted int, excess int, released int)
language plpgsql security definer set search_path = '' as $$
declare l public.group_links; o public.orders; needed int; took int;
begin
  select * into l from public.group_links where code = upper(p_code);
  if l.id is null then raise exception 'Unknown link'; end if;
  select * into o from public.orders where id = l.order_id for update;
  if exists (select 1 from public.group_contributions where payment_ref = p_payment_ref) then
    return query select 0, 0, 0; return;                -- already counted (provider retried)
  end if;
  needed := o.total_ngn - o.paid_ngn;
  if now() >= l.expires_at or needed <= 0 or o.status not in ('awaiting_payment', 'part_paid') then
    insert into public.refunds_due (source, ref_id, amount_ngn) values ('group', l.id, p_amount);
    return query select 0, p_amount, 0; return;
  end if;
  took := least(p_amount, needed);
  if took < 500 and took < needed then raise exception 'The smallest contribution is ₦500'; end if;
  insert into public.group_contributions (link_id, contributor_name, customer_id, amount_ngn, payment_ref)
  values (l.id, coalesce(nullif(trim(p_name), ''), 'A friend'), p_customer, took, p_payment_ref);
  update public.orders set paid_ngn = paid_ngn + took where id = o.id;
  if p_amount > took then insert into public.refunds_due (source, ref_id, amount_ngn) values ('group', l.id, p_amount - took); end if;
  return query select took, p_amount - took, (select count(*)::int from public.order_items where order_id = o.id and released_at is not null);
end $$;

-- Public progress for the contribution page: no amounts per person beyond first names.
create function public.group_link_progress(p_code text)
returns table (target int, raised int, expires_at timestamptz, people int, items jsonb)
language sql stable security definer set search_path = '' as $$
  select o.total_ngn, o.paid_ngn, l.expires_at,
    (select count(*)::int from public.group_contributions c where c.link_id = l.id),
    (select coalesce(jsonb_agg(jsonb_build_object('title', i.title, 'amount', i.unit_ngn * i.qty, 'funded', i.released_at is not null) order by i.priority), '[]')
       from public.order_items i where i.order_id = o.id and i.removed_at is null)
  from public.group_links l join public.orders o on o.id = l.order_id
  where l.code = upper(p_code)
$$;

-- Expired links: keep fully funded items, drop the rest, return leftover money pro rata (exact to ₦1).
create function public.settle_group_links() returns int
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
    select o.paid_ngn - kept into leftover from public.orders o where o.id = l.order_id;
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

-- 4. Cart Clear-Out draw -----------------------------------------------------------
create table public.draws (
  id uuid primary key default gen_random_uuid(),
  week_of date not null unique,
  draw_at timestamptz not null,
  commitment text not null,                             -- sha256(seed), published when the draw opens
  seed text not null,                                   -- secret until the draw (no customer grant)
  revealed_seed text,
  budget_ngn int not null check (budget_ngn between 0 and 500000),
  spent_ngn int not null default 0,
  status text not null default 'open' check (status in ('open', 'drawn')),
  created_at timestamptz not null default now()
);
create table public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete cascade,
  customer_id uuid not null references auth.users (id) on delete cascade,
  cart_total_ngn int not null check (cart_total_ngn > 0),
  held_since timestamptz not null,
  unique (draw_id, customer_id)
);
create table public.draw_winners (
  draw_id uuid not null references public.draws (id) on delete cascade,
  entry_id uuid not null references public.draw_entries (id) on delete cascade,
  ticket text not null,
  amount_ngn int not null,
  primary key (draw_id, entry_id)
);
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.draw_winners enable row level security;
create policy "draws: anyone" on public.draws for select using (true);
create policy "entries: own or staff" on public.draw_entries for select using (customer_id = auth.uid() or public.is_staff());
create policy "winners: anyone" on public.draw_winners for select using (true);
grant select (id, week_of, draw_at, commitment, revealed_seed, budget_ngn, spent_ngn, status) on public.draws to anon, authenticated;
grant select on public.draw_entries to authenticated;
grant select (draw_id, ticket, amount_ngn) on public.draw_winners to anon, authenticated;

-- Profit from orders paid in the last 7 days (selling price minus cost snapshot).
create function public.last_week_profit() returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(sum((i.unit_ngn - i.cost_ngn)::bigint * i.qty), 0)
  from public.order_items i join public.orders o on o.id = i.order_id
  where o.paid_at >= now() - interval '7 days' and o.status not in ('cancelled', 'refunded') and i.removed_at is null
$$;

-- Monday: open this week's draw (Friday 8pm Lagos) and publish the commitment.
create function public.open_weekly_draw() returns uuid
language plpgsql security definer set search_path = '' as $$
declare s text := encode(extensions.gen_random_bytes(16), 'hex'); monday date; d uuid; profit bigint := public.last_week_profit();
begin
  monday := (now() at time zone 'Africa/Lagos')::date - (extract(isodow from now() at time zone 'Africa/Lagos')::int - 1);
  insert into public.draws (week_of, draw_at, commitment, seed, budget_ngn)
  values (monday, ((monday + 4)::timestamp + time '20:00') at time zone 'Africa/Lagos',
          encode(extensions.digest(s, 'sha256'), 'hex'), s,
          case when profit > 0 then least(500000, floor(profit * 0.05))::int else 0 end)
  on conflict (week_of) do nothing
  returning id into d;
  return d;
end $$;

-- Friday: lowest tickets win while their cart fits the budget; at most 5 winners; reveal the seed.
create function public.run_draw(p_draw uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare d public.draws; r record; spent int := 0; n int := 0;
begin
  select * into d from public.draws where id = p_draw for update;
  if d.status <> 'open' or now() < d.draw_at then raise exception 'Draw not due'; end if;
  for r in
    select e.id, e.customer_id, e.cart_total_ngn, encode(extensions.digest(d.seed || ':' || e.id::text, 'sha256'), 'hex') as ticket
    from public.draw_entries e
    where e.draw_id = d.id and e.cart_total_ngn >= 20000 and e.held_since <= d.draw_at - interval '24 hours'
    order by 4
  loop
    exit when n >= 5;
    if spent + r.cart_total_ngn <= d.budget_ngn then
      insert into public.draw_winners (draw_id, entry_id, ticket, amount_ngn) values (d.id, r.id, r.ticket, r.cart_total_ngn);
      insert into public.wallet_ledger (customer_id, amount_ngn, reason, ref_id) values (r.customer_id, r.cart_total_ngn, 'draw_win', d.id);
      spent := spent + r.cart_total_ngn;
      n := n + 1;
    end if;
  end loop;
  update public.draws set status = 'drawn', spent_ngn = spent, revealed_seed = seed where id = d.id;
  return n;
end $$;

create function public.run_due_draws() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in select id from public.draws where status = 'open' and draw_at <= now() loop
    perform public.run_draw(r.id); n := n + 1;
  end loop;
  return n;
end $$;

-- 5. Profit guard ---------------------------------------------------------------------
alter table public.product_skus
  add column promo_paused boolean not null default false,
  add column guard_verdict text check (guard_verdict in ('safe', 'watch', 'pause', 'block')),
  add column guard_checked_at timestamptz;
grant select (promo_paused) on public.product_skus to anon, authenticated;

create table public.profit_audits (
  id bigint generated always as identity primary key,
  run_at timestamptz not null default now(),
  checked int not null, safe int not null, watch int not null, paused int not null, blocked int not null
);
alter table public.profit_audits enable row level security;
create policy "audits: staff" on public.profit_audits for select using (public.is_staff());
grant select on public.profit_audits to authenticated;

-- Worst case per variant: deepest promo, or list minus the 50%-of-profit discount cap. Then the payment fee,
-- then cost, then cost +10% (naira can move while Pay small small locks a price). Keep ≥5% of cost.
create function public.profit_audit() returns public.profit_audits
language plpgsql security definer set search_path = '' as $$
declare s public.pricing_settings; res public.profit_audits;
begin
  select * into s from public.pricing_settings where id = 1;
  with v as (
    select k.id, k.active, k.guard_verdict, k.cost_ngn as cost, k.price_list as list,
      least(k.price_midnight, k.price_event, k.price_flash, k.price_retailer, k.price_list - s.max_discount_share * k.planned_profit_ngn) as floor
    from public.product_skus k join public.products p on p.id = k.product_id
    where p.status = 'active' and k.price_list > 0 and k.cost_ngn > 0 and (k.active or k.guard_verdict = 'block')
  ), m as (
    select id, active, guard_verdict, cost, list,
      floor - public.payment_fee(floor) - cost as margin,
      floor - public.payment_fee(floor) - cost * 1.1 as stressed,
      list - public.payment_fee(list) - cost as list_margin,
      0.05 * cost as need
    from v
  ), verdicts as (
    select id, active, guard_verdict as before,
      case when stressed >= need then 'safe' when margin >= need then 'watch' when list_margin >= need then 'pause' else 'block' end as verdict
    from m
  ), upd as (
    update public.product_skus k set
      guard_verdict = x.verdict,
      guard_checked_at = now(),
      promo_paused = x.verdict in ('pause', 'block'),
      active = case when x.verdict = 'block' then false when x.before = 'block' then true else k.active end
    from verdicts x where k.id = x.id
    returning x.verdict
  )
  insert into public.profit_audits (checked, safe, watch, paused, blocked)
  select count(*), count(*) filter (where verdict = 'safe'), count(*) filter (where verdict = 'watch'),
         count(*) filter (where verdict = 'pause'), count(*) filter (where verdict = 'block')
  from upd
  returning * into res;
  return res;
end $$;

-- Lock down: money-moving functions run only from the server (service role) or the scheduler.
do $$
declare f text;
begin
  foreach f in array array[
    'public.release_funded_items(uuid)', 'public.auto_deliver_orders()', 'public.create_payment_plan(uuid, int)',
    'public.sweep_payment_plans()', 'public.contribute(text, int, text, uuid, text)', 'public.settle_group_links()',
    'public.last_week_profit()', 'public.open_weekly_draw()', 'public.run_draw(uuid)', 'public.run_due_draws()', 'public.profit_audit()',
    'public.orders_guard()', 'public.orders_after_paid()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
grant execute on function public.group_link_progress(text) to anon, authenticated;

-- Schedules (UTC; Lagos is UTC+1).
select cron.schedule('fc-auto-deliver', '7 * * * *', 'select public.auto_deliver_orders()');
select cron.schedule('fc-plan-sweep', '0 7 * * *', 'select public.sweep_payment_plans()');
select cron.schedule('fc-group-settle', '*/15 * * * *', 'select public.settle_group_links()');
select cron.schedule('fc-draw-open', '5 0 * * 1', 'select public.open_weekly_draw()');
select cron.schedule('fc-draw-run', '*/5 19 * * 5', 'select public.run_due_draws()');
select cron.schedule('fc-profit-guard', '20 * * * *', 'select public.profit_audit()');
