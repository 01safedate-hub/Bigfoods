-- 012: coupon rules that can't be abused, real points at checkout, and notifications (in-app + email outbox).

-- Coupon rules ---------------------------------------------------------------------
alter table public.coupons
  add column per_customer_limit int not null default 1 check (per_customer_limit between 1 and 100),
  add column new_customers_only boolean not null default false,
  add column max_redemptions int check (max_redemptions > 0),
  add column budget_ngn int check (budget_ngn > 0);
update public.coupons set new_customers_only = true where id = 'welcome-500';

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id text not null references public.coupons (id),
  customer_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  amount_ngn int not null check (amount_ngn > 0),
  created_at timestamptz not null default now(),
  released_at timestamptz                                -- order cancelled: the use is given back
);
create index coupon_redemptions_live_idx on public.coupon_redemptions (coupon_id, customer_id) where released_at is null;
alter table public.coupon_redemptions enable row level security;
create policy "redemptions: own or staff" on public.coupon_redemptions for select using (customer_id = auth.uid() or public.is_staff());
grant select on public.coupon_redemptions to authenticated;

-- Why a customer can't use a coupon right now, or null if they can. Checked live (no caching).
create function public.coupon_block_reason(p_coupon text, p_customer uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when c.id is null then 'This coupon doesn’t exist'
    when not c.active or (c.starts_at is not null and c.starts_at > now()) or (c.ends_at is not null and c.ends_at <= now()) then 'This coupon has ended'
    when p_customer is null then 'Sign in to use coupons'
    when (select count(*) from public.coupon_redemptions r where r.coupon_id = c.id and r.customer_id = p_customer and r.released_at is null) >= c.per_customer_limit
      then 'You’ve already used this coupon'
    when c.new_customers_only and exists (select 1 from public.orders o where o.customer_id = p_customer and o.status not in ('cancelled', 'awaiting_payment'))
      then 'This coupon is for your first order'
    when c.max_redemptions is not null and (select count(*) from public.coupon_redemptions r where r.coupon_id = c.id and r.released_at is null) >= c.max_redemptions
      then 'This coupon has run out'
    when c.budget_ngn is not null and (select coalesce(sum(amount_ngn), 0) from public.coupon_redemptions r where r.coupon_id = c.id and r.released_at is null) >= c.budget_ngn
      then 'This coupon has run out'
  end
  from (select 1) one left join public.coupons c on c.id = p_coupon
$$;

-- Points spent on orders come back if the order is cancelled.
alter table public.points_ledger drop constraint points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check
  check (reason in ('checkin', 'order', 'review', 'referral', 'verify', 'spend', 'refund', 'adjustment'));

-- Settings the database needs to call the website (email sending). ----------------
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
comment on table public.app_settings is 'Server-only. site_url: where /api/notify/drain lives (e.g. https://fastchina.shop).';

-- Notifications --------------------------------------------------------------------
create table public.notification_prefs (
  customer_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  order_email boolean not null default true,              -- orders, payments, refunds (strongly recommended)
  marketing_email boolean not null default false,         -- Midnight Drop, events: opt-in only (NDPA consent)
  in_app_marketing boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
create policy "prefs: own" on public.notification_prefs for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
grant select, insert, update on public.notification_prefs to authenticated;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  link text,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_customer_idx on public.notifications (customer_id, created_at desc);
alter table public.notifications enable row level security;
create policy "notifications: own" on public.notifications for select using (customer_id = auth.uid());
create policy "notifications: mark read" on public.notifications for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users (id) on delete set null,
  to_email text not null,
  template text not null,
  data jsonb not null default '{}',
  marketing boolean not null default false,
  dedupe_key text unique,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  provider_id text,
  created_at timestamptz not null default now()
);
create index email_outbox_due_idx on public.email_outbox (send_after) where status = 'pending';
alter table public.email_outbox enable row level security;
create policy "outbox: staff" on public.email_outbox for select using (public.is_staff());
grant select on public.email_outbox to authenticated;

-- One call for every message: an in-app notification (signed-in customers) and an email
-- (if we have an address and their preferences allow it). Duplicates are ignored by key.
create function public.notify(
  p_customer uuid, p_kind text, p_title text, p_body text, p_link text,
  p_template text, p_data jsonb, p_dedupe text, p_marketing boolean default false, p_to_email text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare pref public.notification_prefs; addr text;
begin
  if p_customer is not null then
    select * into pref from public.notification_prefs where customer_id = p_customer;
    if not p_marketing or coalesce(pref.in_app_marketing, true) then
      insert into public.notifications (customer_id, kind, title, body, link, dedupe_key)
      values (p_customer, p_kind, p_title, p_body, p_link, p_dedupe) on conflict (dedupe_key) do nothing;
    end if;
  end if;
  if p_template is null then return; end if;
  if p_marketing and not coalesce(pref.marketing_email, false) then return; end if;
  if not p_marketing and p_customer is not null and not coalesce(pref.order_email, true) then return; end if;
  addr := coalesce(p_to_email, (select u.email from auth.users u where u.id = p_customer));
  if addr is null or addr = '' then return; end if;
  insert into public.email_outbox (customer_id, to_email, template, data, marketing, dedupe_key)
  values (p_customer, addr, p_template, coalesce(p_data, '{}') || jsonb_build_object('customer_id', p_customer), p_marketing, p_dedupe)
  on conflict (dedupe_key) do nothing;
end $$;

create function public.naira_text(n bigint) returns text language sql immutable set search_path = '' as $$
  select '₦' || to_char(n, 'FM999,999,999,990')
$$;

-- Placing orders: coupons and points are checked and recorded in the same transaction ------
drop function public.place_order(uuid, text, text, text, int, int, text, jsonb, int);
create function public.place_order(
  p_customer uuid, p_station text, p_phone text, p_mode text, p_total int,
  p_coupon text, p_coupon_amount int, p_points int, p_items jsonb, p_weeks int default null
) returns table (order_id uuid, code text, link_code text)
language plpgsql security definer set search_path = '' as $$
declare st public.pickup_stations; v_order uuid; ocode text; lcode text; why text; bal int;
begin
  select * into st from public.pickup_stations where id = p_station and active;
  if st.id is null then raise exception 'Choose a pickup station'; end if;
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then raise exception 'Cart is empty or too large'; end if;
  if coalesce(p_coupon_amount, 0) < 0 or coalesce(p_points, 0) < 0 then raise exception 'Invalid discount'; end if;

  if coalesce(p_coupon_amount, 0) > 0 then
    perform pg_advisory_xact_lock(hashtext('coupon:' || p_coupon));
    why := public.coupon_block_reason(p_coupon, p_customer);
    if why is not null then raise exception '%', why using errcode = 'check_violation'; end if;
  end if;
  if coalesce(p_points, 0) > 0 then
    if p_customer is null then raise exception 'Sign in to use points'; end if;
    perform pg_advisory_xact_lock(hashtext('points:' || p_customer::text));   -- two checkouts can't spend the same points
    select coalesce(sum(points), 0) into bal from public.points_ledger where customer_id = p_customer;
    if bal < p_points then raise exception 'Not enough points' using errcode = 'check_violation'; end if;
  end if;

  insert into public.orders (customer_id, station_id, state, pay_mode, total_ngn, phone, coupon_id, discount_ngn)
  values (p_customer, st.id, st.state, p_mode, p_total, p_phone, case when p_coupon_amount > 0 then p_coupon end, coalesce(p_coupon_amount, 0) + coalesce(p_points, 0))
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

  perform public.notify(p_customer, 'order', 'Order #' || ocode || ' placed',
    case p_mode when 'group' then 'Share your Group pay link. Items ship as they’re paid for.'
                when 'small' then 'Your Pay small small plan has started. We order from the factory when it’s fully paid.'
                else 'Complete your payment and we’ll order it from the factory.' end,
    '/track?code=' || ocode, 'order_placed',
    jsonb_build_object('code', ocode, 'total', p_total, 'pay_mode', p_mode, 'station', st.name, 'link_code', lcode,
      'items', p_items, 'instalments', (select jsonb_agg(jsonb_build_object('n', i.n, 'due', i.due_at, 'amount', i.amount_ngn) order by i.n)
        from public.plan_instalments i join public.payment_plans p on p.id = i.plan_id where p.order_id = v_order)),
    'order:' || v_order || ':placed');
  return query select v_order, ocode, lcode;
end $$;

-- Order status messages, plus giving back coupon uses and points when an order is cancelled.
create function public.orders_notify() returns trigger
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
    'station', (select name from public.pickup_stations where id = new.station_id), 'shipped_at', new.shipped_at,
    'items', (select jsonb_agg(jsonb_build_object('title', i.title, 'variant', i.variant_label, 'qty', i.qty)) from public.order_items i where i.order_id = new.id and i.removed_at is null));
  case new.status
    when 'paid' then t := 'payment_complete'; title := 'Fully paid · #' || new.code; body := 'We’re ordering your items from the factory now.';
    when 'purchased' then t := 'order_bought'; title := 'Bought from the factory'; body := 'Your items for #' || new.code || ' are on their way to our China warehouse for a photo check.';
    when 'shipped' then t := 'order_shipped'; title := 'On the way · #' || new.code; body := 'Your order left China. It’ll be at your pickup station by ' || to_char((new.shipped_at at time zone 'Africa/Lagos') + interval '10 days', 'FMDD Mon') || '.';
    when 'delivered' then t := 'order_ready'; title := 'Ready for pickup · #' || new.code; body := 'Your order is at your Jumia pickup station. Bring your pickup code and an ID.';
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
create trigger orders_notify after update on public.orders for each row execute function public.orders_notify();

-- Group pay: tell the organiser when someone chips in.
create function public.contributions_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare o public.orders; l public.group_links;
begin
  select * into l from public.group_links where id = new.link_id;
  select * into o from public.orders where id = l.order_id;
  perform public.notify(o.customer_id, 'group', new.contributor_name || ' chipped in ' || public.naira_text(new.amount_ngn),
    public.naira_text(o.paid_ngn) || ' of ' || public.naira_text(o.total_ngn) || ' raised for #' || o.code || '.', '/track?code=' || o.code, 'group_contribution',
    jsonb_build_object('code', o.code, 'name', new.contributor_name, 'amount', new.amount_ngn, 'raised', o.paid_ngn, 'total', o.total_ngn, 'link_code', l.code),
    'contribution:' || new.id);
  return null;
end $$;
create trigger contributions_notify after insert on public.group_contributions for each row execute function public.contributions_notify();

-- Q&A: tell the asker when staff answer.
create function public.questions_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.products;
begin
  if new.status = 'answered' and old.status is distinct from 'answered' and new.asked_by is not null then
    select * into p from public.products where id = new.product_id;
    perform public.notify(new.asked_by, 'qa', 'Your question was answered', left(new.answer, 140), '/product/' || p.slug || '#qa', 'question_answered',
      jsonb_build_object('product', p.title, 'slug', p.slug, 'question', new.question, 'answer', new.answer), 'qa:' || new.id);
  end if;
  return null;
end $$;
create trigger questions_notify after update on public.product_questions for each row execute function public.questions_notify();

-- Wallet credits that aren't already explained by an order message.
create function public.wallet_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.reason = 'draw_win' then
    perform public.notify(new.customer_id, 'wallet', 'You won the Cart Clear-Out!', public.naira_text(new.amount_ngn) || ' is in your wallet. Check out your cart for free.',
      '/cart', 'draw_won', jsonb_build_object('amount', new.amount_ngn), 'wallet:' || new.id);
  elsif new.reason = 'group_refund' then
    perform public.notify(new.customer_id, 'wallet', public.naira_text(new.amount_ngn) || ' returned to your wallet', 'A Group pay link closed before the next item was fully paid.',
      '/account', 'wallet_credit', jsonb_build_object('amount', new.amount_ngn, 'reason', 'group_refund'), 'wallet:' || new.id);
  end if;
  return null;
end $$;
create trigger wallet_notify after insert on public.wallet_ledger for each row execute function public.wallet_notify();

-- Welcome message when someone joins.
create function public.profiles_welcome() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.notify(new.id, 'welcome', 'Welcome to FastChina', 'Free shipping to your Jumia pickup station on everything. Your ₦500 first-order coupon is ready.',
    '/deals', 'welcome', '{}'::jsonb, 'welcome:' || new.id);
  return null;
end $$;
create trigger profiles_welcome after insert on public.profiles for each row execute function public.profiles_welcome();

-- Reminders, every 30 minutes ---------------------------------------------------------
create function public.queue_reminders() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0; today date := (now() at time zone 'Africa/Lagos')::date;
begin
  -- Pay small small: unpaid instalments due within 48 hours, 3 days late, and 2 days before cancellation.
  for r in
    select o.customer_id, o.code, o.id as order_id, o.paid_ngn, o.total_ngn, s.n, s.due_at, s.amount_ngn, s.cum, p.weeks
    from public.payment_plans p join public.orders o on o.id = p.order_id
    join lateral (select i.n, i.due_at, i.amount_ngn, sum(i.amount_ngn) over (order by i.n) as cum from public.plan_instalments i where i.plan_id = p.id) s on true
    where p.status = 'active' and o.status in ('awaiting_payment', 'part_paid') and s.cum > o.paid_ngn and s.n > 1
  loop
    if r.due_at > now() and r.due_at <= now() + interval '48 hours' then
      perform public.notify(r.customer_id, 'payment', 'Payment ' || r.n || ' of ' || r.weeks || ' due ' || to_char(r.due_at at time zone 'Africa/Lagos', 'FMDay'),
        public.naira_text(least(r.amount_ngn, r.cum - r.paid_ngn)) || ' for order #' || r.code || '.', '/track?code=' || r.code, 'instalment_due',
        jsonb_build_object('code', r.code, 'n', r.n, 'weeks', r.weeks, 'due', r.due_at, 'amount', least(r.amount_ngn, r.cum - r.paid_ngn), 'paid', r.paid_ngn, 'total', r.total_ngn),
        'plan:' || r.order_id || ':' || r.n || ':due');
      n := n + 1;
    elsif r.due_at <= now() - interval '3 days' and r.due_at > now() - interval '12 days' then
      perform public.notify(r.customer_id, 'payment', 'Payment overdue · #' || r.code,
        'Pay ' || public.naira_text(r.cum - r.paid_ngn) || ' by ' || to_char((r.due_at + interval '14 days') at time zone 'Africa/Lagos', 'FMDD Mon') || ' to keep your price.',
        '/track?code=' || r.code, 'instalment_late',
        jsonb_build_object('code', r.code, 'n', r.n, 'overdue', r.cum - r.paid_ngn, 'cancel_at', r.due_at + interval '14 days'),
        'plan:' || r.order_id || ':' || r.n || ':late');
      n := n + 1;
    elsif r.due_at <= now() - interval '12 days' and r.due_at > now() - interval '14 days' then
      perform public.notify(r.customer_id, 'payment', 'Last chance · #' || r.code,
        'Your plan is cancelled on ' || to_char((r.due_at + interval '14 days') at time zone 'Africa/Lagos', 'FMDD Mon') || ' unless you pay ' || public.naira_text(r.cum - r.paid_ngn) || '.',
        '/track?code=' || r.code, 'plan_final_warning',
        jsonb_build_object('code', r.code, 'overdue', r.cum - r.paid_ngn, 'cancel_at', r.due_at + interval '14 days'),
        'plan:' || r.order_id || ':' || r.n || ':final');
      n := n + 1;
    end if;
  end loop;

  -- Group pay links closing within 24 hours and not fully paid.
  for r in
    select l.id, l.code as link_code, l.expires_at, o.customer_id, o.code, o.paid_ngn, o.total_ngn
    from public.group_links l join public.orders o on o.id = l.order_id
    where l.settled_at is null and l.expires_at > now() and l.expires_at <= now() + interval '24 hours' and o.paid_ngn < o.total_ngn
  loop
    perform public.notify(r.customer_id, 'group', 'Your Group pay link closes soon', public.naira_text(r.total_ngn - r.paid_ngn) || ' still needed for #' || r.code || '. Share it once more.',
      '/c/' || r.link_code, 'group_expiring', jsonb_build_object('code', r.code, 'link_code', r.link_code, 'raised', r.paid_ngn, 'total', r.total_ngn, 'expires_at', r.expires_at),
      'link:' || r.id || ':expiring');
    n := n + 1;
  end loop;

  -- Midnight Drop alert at about 11:30pm Lagos, to customers who opted in.
  if extract(hour from now() at time zone 'Africa/Lagos') = 23 and extract(minute from now() at time zone 'Africa/Lagos') >= 25 then
    for r in select customer_id from public.notification_prefs where marketing_email or in_app_marketing loop
      perform public.notify(r.customer_id, 'promo', 'Midnight Drop starts in 30 minutes', 'Prices fall from 12am to 4am tonight. Your saved items are waiting.',
        '/deals', 'midnight_drop', jsonb_build_object('date', today), 'midnight:' || today || ':' || r.customer_id, true);
      n := n + 1;
    end loop;
  end if;
  return n;
end $$;

-- Email sending: claim a batch for the website's sender, then record the result. ---------
create function public.claim_emails(p_limit int default 20) returns setof public.email_outbox
language plpgsql security definer set search_path = '' as $$
begin
  update public.email_outbox set status = 'pending' where status = 'sending' and send_after < now() - interval '10 minutes';
  return query
  update public.email_outbox e set status = 'sending', attempts = e.attempts + 1, send_after = now()
  where e.id in (select id from public.email_outbox where status = 'pending' and send_after <= now() order by send_after limit least(p_limit, 100) for update skip locked)
  returning e.*;
end $$;

create function public.finish_email(p_id uuid, p_ok boolean, p_provider_id text, p_error text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.email_outbox set
    status = case when p_ok then 'sent' when attempts >= 5 then 'failed' else 'pending' end,
    sent_at = case when p_ok then now() end,
    provider_id = p_provider_id,
    last_error = left(p_error, 500),
    send_after = case when p_ok then send_after else now() + (interval '1 minute' * power(2, attempts)) end   -- 2, 4, 8, 16 minutes
  where id = p_id;
end $$;

-- Calls the website's sender every minute once app_settings.site_url is set.
create function public.kick_email_sender() returns void
language plpgsql security definer set search_path = '' as $$
declare url text; tok text;
begin
  select value into url from public.app_settings where key = 'site_url';
  if url is null or not exists (select 1 from public.email_outbox where status = 'pending' and send_after <= now()) then return; end if;
  select token into tok from public.internal_tokens where name = 'tasks';
  perform net.http_post(url || '/api/notify/drain', '{}'::jsonb, '{}'::jsonb,
    jsonb_build_object('Content-Type', 'application/json', 'x-task-token', tok), 10000);
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.notify(uuid, text, text, text, text, text, jsonb, text, boolean, text)', 'public.place_order(uuid, text, text, text, int, text, int, int, jsonb, int)',
    'public.queue_reminders()', 'public.claim_emails(int)', 'public.finish_email(uuid, boolean, text, text)', 'public.kick_email_sender()',
    'public.orders_notify()', 'public.contributions_notify()', 'public.questions_notify()', 'public.wallet_notify()', 'public.profiles_welcome()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
-- Customers may ask why a coupon doesn't apply to them (used by the checkout quote).
revoke execute on function public.coupon_block_reason(text, uuid) from public, anon, authenticated;
grant execute on function public.coupon_block_reason(text, uuid) to service_role;

select cron.schedule('fc-reminders', '*/30 * * * *', 'select public.queue_reminders()');
select cron.schedule('fc-email-sender', '* * * * *', 'select public.kick_email_sender()');
