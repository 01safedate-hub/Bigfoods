-- 013: compliance. Rate limits, email bounce/complaint suppression, delivery status,
-- quiet hours for reminders, data retention clean-up, and account deletion (NDPA 2023).

-- Rate limits (fixed window). Used by the website for tracking, questions, orders and coupons.
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds); c int;
begin
  insert into public.rate_limits (key, window_start, hits) values (left(p_key, 200), w, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into c;
  return c <= p_limit;      -- true = allowed
end $$;

-- Addresses that bounced (permanently) or marked us as spam are never emailed again.
create table public.email_suppressions (
  email text primary key,
  reason text not null check (reason in ('bounced', 'complained', 'manual')),
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
create policy "suppressions: staff" on public.email_suppressions for select using (public.is_staff());
grant select on public.email_suppressions to authenticated;

alter table public.email_outbox add column delivery text check (delivery in ('delivered', 'bounced', 'complained', 'delayed', 'opened', 'clicked'));
create index email_outbox_provider_idx on public.email_outbox (provider_id) where provider_id is not null;

-- Records a Resend webhook event (called by the website after verifying the signature).
create function public.record_email_event(p_provider_id text, p_type text, p_email text, p_hard boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.email_outbox set delivery = case p_type
      when 'email.delivered' then 'delivered' when 'email.bounced' then 'bounced' when 'email.complained' then 'complained'
      when 'email.delivery_delayed' then 'delayed' when 'email.opened' then coalesce(delivery, 'opened') when 'email.clicked' then 'clicked' else delivery end
  where provider_id = p_provider_id;
  if p_email is not null and ((p_type = 'email.bounced' and p_hard) or p_type = 'email.complained') then
    insert into public.email_suppressions (email, reason) values (lower(p_email), case when p_type = 'email.complained' then 'complained' else 'bounced' end)
    on conflict (email) do nothing;
    -- Someone who marks offers as spam is also unsubscribed from offers.
    if p_type = 'email.complained' then
      update public.notification_prefs set marketing_email = false, updated_at = now()
      where customer_id in (select id from auth.users where lower(email) = lower(p_email));
    end if;
  end if;
end $$;

-- Suppressed addresses are skipped when queueing.
create or replace function public.notify(
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
  if exists (select 1 from public.email_suppressions where email = lower(addr)) then return; end if;
  insert into public.email_outbox (customer_id, to_email, template, data, marketing, dedupe_key)
  values (p_customer, addr, p_template, coalesce(p_data, '{}') || jsonb_build_object('customer_id', p_customer), p_marketing, p_dedupe)
  on conflict (dedupe_key) do nothing;
end $$;

create or replace function public.queue_reminders() returns int
language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0; today date := (now() at time zone 'Africa/Lagos')::date;
  hr int := extract(hour from now() at time zone 'Africa/Lagos');
begin
  -- Quiet hours: payment and Group pay reminders only go out between 8am and 8pm Lagos time.
  if hr between 8 and 19 then
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
  end if;

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


-- Data retention (NDPA: keep personal data no longer than needed).
create function public.retention_cleanup() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a int; b int; c int; d int;
begin
  delete from public.notifications where read_at is not null and created_at < now() - interval '90 days';
  get diagnostics a = row_count;
  delete from public.notifications where created_at < now() - interval '365 days';
  get diagnostics b = row_count;
  -- Keep the send record, drop the personal content of old emails.
  update public.email_outbox set data = '{}'::jsonb, to_email = 'redacted@invalid' where created_at < now() - interval '180 days' and to_email <> 'redacted@invalid';
  get diagnostics c = row_count;
  delete from public.rate_limits where window_start < now() - interval '2 days';
  get diagnostics d = row_count;
  return jsonb_build_object('notifications', a + b, 'emails_redacted', c, 'rate_limits', d);
end $$;

-- Account deletion: personal data goes; orders stay (tax and accounting law) but are anonymised.
create function public.anonymise_customer(p_customer uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.orders set phone = null where customer_id = p_customer;
  update public.group_contributions set contributor_name = 'A friend' where customer_id = p_customer;
  update public.product_questions set asker_name = 'Customer' where asked_by = p_customer;
  delete from public.email_outbox where customer_id = p_customer and status in ('pending', 'sending');
  update public.email_outbox set to_email = 'redacted@invalid', data = '{}'::jsonb where customer_id = p_customer;
  delete from public.draw_entries where customer_id = p_customer and draw_id in (select id from public.draws where status = 'open');
end $$;

do $$
declare f text;
begin
  foreach f in array array['public.hit_rate_limit(text, int, int)', 'public.record_email_event(text, text, text, boolean)', 'public.retention_cleanup()', 'public.anonymise_customer(uuid)'] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

select cron.schedule('fc-retention', '40 3 * * *', 'select public.retention_cleanup()');
