-- 010: wishlist, points with daily check-in, balances, admin dashboard, cancel/refund and staff roles.

-- Wishlist (synced across devices) ----------------------------------------------
create table public.wishlists (
  customer_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);
alter table public.wishlists enable row level security;
create policy "wishlist: own" on public.wishlists for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
grant select, insert, delete on public.wishlists to authenticated;

-- Points ------------------------------------------------------------------------
create table public.points_ledger (
  id bigint generated always as identity primary key,
  customer_id uuid not null references auth.users (id) on delete cascade,
  points int not null check (points <> 0),
  reason text not null check (reason in ('checkin', 'order', 'review', 'referral', 'verify', 'spend', 'adjustment')),
  day date,                                            -- Lagos date, for check-ins
  ref_id uuid,
  created_at timestamptz not null default now()
);
create unique index points_one_checkin_a_day on public.points_ledger (customer_id, day) where reason = 'checkin';
create index points_customer_idx on public.points_ledger (customer_id, created_at desc);
alter table public.points_ledger enable row level security;
create policy "points: own or staff" on public.points_ledger for select using (customer_id = auth.uid() or public.is_staff());
grant select on public.points_ledger to authenticated;

-- Daily check-in: +5 a day, +30 on every 7th day in a row. Once per Lagos day.
create function public.daily_checkin() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); today date := (now() at time zone 'Africa/Lagos')::date; streak int := 0; d date; pts int;
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from public.points_ledger where customer_id = uid and reason = 'checkin' and day = today) then
    select count(*) into streak from public.points_ledger where customer_id = uid and reason = 'checkin' and day > today - 7;
    return jsonb_build_object('already', true, 'points', 0, 'streak', streak);
  end if;
  d := today - 1;
  while exists (select 1 from public.points_ledger where customer_id = uid and reason = 'checkin' and day = d) loop
    streak := streak + 1; d := d - 1;
  end loop;
  streak := streak + 1;                                -- including today
  pts := case when streak % 7 = 0 then 30 else 5 end;
  insert into public.points_ledger (customer_id, points, reason, day) values (uid, pts, 'checkin', today);
  return jsonb_build_object('already', false, 'points', pts, 'streak', streak);
end $$;
revoke execute on function public.daily_checkin() from public, anon;
grant execute on function public.daily_checkin() to authenticated;

-- Balances (row level security of the ledgers applies: customers see their own) ---
create view public.my_balances with (security_invoker = true) as
select u.id as customer_id,
  coalesce((select sum(amount_ngn) from public.wallet_ledger w where w.customer_id = u.id), 0)::int as wallet_ngn,
  coalesce((select sum(points) from public.points_ledger p where p.customer_id = u.id), 0)::int as points
from (select auth.uid() as id) u where u.id is not null;
grant select on public.my_balances to authenticated;

-- Cancel or refund (staff, through the server) ----------------------------------
-- Before purchase: cancel. After shipping: refund (never reached the station). Money goes to the wallet,
-- or to refunds_due for guests (paid back through the payment provider).
create function public.cancel_or_refund(p_order uuid, p_note text) returns text
language plpgsql security definer set search_path = '' as $$
declare o public.orders; target text;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'Unknown order'; end if;
  target := case when o.status = 'shipped' then 'refunded' else 'cancelled' end;
  perform set_config('fastchina.note', coalesce(nullif(trim(p_note), ''), 'by staff'), true);
  update public.orders set status = target where id = o.id;     -- the status trigger refuses illegal moves
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

-- Staff roles (super admin only, checked again here) ----------------------------
create function public.set_staff_role(p_actor uuid, p_user uuid, p_role public.app_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id = p_actor and role = 'super_admin') then raise exception 'Only a super admin can change roles'; end if;
  if p_actor = p_user and p_role <> 'super_admin' and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
    raise exception 'You are the last super admin';
  end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

-- Dashboard numbers (Lagos days) ----------------------------------------------
create function public.admin_dashboard() returns jsonb
language sql stable security definer set search_path = '' as $$
  with today as (select (now() at time zone 'Africa/Lagos')::date as d),
  paid as (
    select o.id, o.total_ngn, (o.paid_at at time zone 'Africa/Lagos')::date as d,
      (select coalesce(sum((i.unit_ngn - i.cost_ngn) * i.qty), 0) from public.order_items i where i.order_id = o.id and i.removed_at is null) - o.discount_ngn as profit
    from public.orders o where o.paid_at >= now() - interval '14 days' and o.status not in ('cancelled', 'refunded')
  )
  select jsonb_build_object(
    'sales_today', (select coalesce(sum(total_ngn), 0) from paid, today where paid.d = today.d),
    'orders_today', (select count(*) from paid, today where paid.d = today.d),
    'sales_7d', (select coalesce(sum(total_ngn), 0) from paid, today where paid.d > today.d - 7),
    'profit_7d', (select coalesce(sum(profit), 0) from paid, today where paid.d > today.d - 7),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', g.d, 'sales', coalesce(s.sales, 0)) order by g.d), '[]')
              from (select generate_series((today.d - 13)::timestamp, today.d::timestamp, interval '1 day')::date as d from today) g
              left join (select d, sum(total_ngn) as sales from paid group by d) s on s.d = g.d),
    'by_status', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) as n from public.orders group by status) x),
    'plans_at_risk', (select count(*) from public.payment_plans p join public.orders o on o.id = p.order_id
                      where p.status = 'active' and exists (
                        select 1 from (select i.due_at, sum(i.amount_ngn) over (order by i.n) as cum from public.plan_instalments i where i.plan_id = p.id) s
                        where s.cum > o.paid_ngn and s.due_at < now() - interval '3 days')),
    'questions_pending', (select count(*) from public.product_questions where status = 'pending'),
    'refunds_pending', (select coalesce(sum(amount_ngn), 0) from public.refunds_due where status = 'pending'),
    'guard', (select to_jsonb(a) from public.profit_audits a order by run_at desc limit 1),
    'guarded', (select coalesce(jsonb_agg(jsonb_build_object('title', p.title, 'variant', k.props_text, 'verdict', k.guard_verdict)), '[]')
                from public.product_skus k join public.products p on p.id = k.product_id where k.guard_verdict in ('pause', 'block', 'watch'))
  )
$$;

do $$
declare f text;
begin
  foreach f in array array['public.cancel_or_refund(uuid, text)', 'public.set_staff_role(uuid, uuid, public.app_role)', 'public.admin_dashboard()'] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
