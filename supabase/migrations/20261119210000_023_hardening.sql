-- 023: security and speed hardening after a review of the live project.
--
-- 1. Private columns really private. Supabase gives anon/authenticated SELECT on whole tables by default,
--    which silently overrides "grant select (some columns)". Here SELECT is limited to the public columns.
--    Fixes: seller bank details, owner ids and sales were readable by anyone; customers could read item
--    costs on their own orders; the draw seed (secret until Friday) was public; review/question authors' ids.
-- 2. Sellers read their own bank details through my_payout_account().
-- 3. Group pay: a contribution under ₦500 is refunded instead of failing after the payment went through.
-- 4. Only the server can count store visits. Trigger functions can't be called through the API.
-- 5. store_earnings no longer a SECURITY DEFINER view (same rows, via a function).
-- 6. RLS speed: auth.uid() and is_staff() evaluated once per query; one SELECT policy per table;
--    indexes on every foreign key.

-- 1. Column privacy ------------------------------------------------------------------------------
do $$
declare r record; cols text;
begin
  for r in select * from (values
    ('stores',            'anon',          array['owner_id', 'plan_renews_at', 'lifetime_sales_ngn', 'bank_name', 'account_number', 'account_name']),
    ('stores',            'authenticated', array['plan_renews_at', 'lifetime_sales_ngn', 'bank_name', 'account_number', 'account_name']),
    ('order_items',       'anon',          array['cost_ngn', 'store_markup_ngn', 'payout_id']),
    ('order_items',       'authenticated', array['cost_ngn', 'store_markup_ngn', 'payout_id']),
    ('draws',             'anon',          array['seed']),
    ('draws',             'authenticated', array['seed']),
    ('draw_winners',      'anon',          array['entry_id']),
    ('draw_winners',      'authenticated', array['entry_id']),
    ('product_reviews',   'anon',          array['customer_id', 'order_item_id']),
    ('product_reviews',   'authenticated', array['customer_id', 'order_item_id']),
    ('product_questions', 'anon',          array['asked_by']),
    ('product_questions', 'authenticated', array['asked_by']),
    ('pickup_stations',   'anon',          array['added_by']),
    ('pickup_stations',   'authenticated', array['added_by'])
  ) as t(tbl, role, hidden)
  loop
    execute format('revoke select on public.%I from %I', r.tbl, r.role);
    select string_agg(quote_ident(attname), ', ' order by attnum) into cols
    from pg_attribute where attrelid = format('public.%I', r.tbl)::regclass and attnum > 0 and not attisdropped and attname <> all (r.hidden);
    execute format('grant select (%s) on public.%I to %I', cols, r.tbl, r.role);
  end loop;
end $$;

-- stores: writes only through the columns the app uses (stores_guard still protects plan, status, sales…).
revoke insert, update, delete on public.stores from anon, authenticated;
grant insert (slug, name, tagline, accent, theme) on public.stores to authenticated;
grant update (name, tagline, accent, theme, custom_domain, bank_name, account_number, account_name, allow_small_small) on public.stores to authenticated;

-- Nobody outside the server needs TRUNCATE, REFERENCES or TRIGGER on any table.
do $$
declare r record;
begin
  for r in select relname from pg_class where relnamespace = 'public'::regnamespace and relkind in ('r', 'p') loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', r.relname);
  end loop;
end $$;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- 2. A seller's own payout account ---------------------------------------------------------------
create function public.my_payout_account()
returns table (bank_name text, account_number text, account_name text)
language sql stable security definer set search_path = '' as $$
  select s.bank_name, s.account_number, s.account_name from public.stores s where s.owner_id = (select auth.uid())
$$;
revoke execute on function public.my_payout_account() from public, anon;
grant execute on function public.my_payout_account() to authenticated;

-- 3. Group pay: never fail after the money arrived ----------------------------------------------
create or replace function public.contribute(p_code text, p_amount integer, p_name text, p_customer uuid, p_payment_ref text)
returns table (accepted integer, excess integer, released integer)
language plpgsql security definer set search_path = '' as $function$
declare l public.group_links; o public.orders; needed int; took int;
begin
  select * into l from public.group_links where code = upper(p_code);
  if l.id is null then raise exception 'Unknown link'; end if;
  select * into o from public.orders where id = l.order_id for update;
  if exists (select 1 from public.group_contributions where payment_ref = p_payment_ref) then
    return query select 0, 0, 0; return;
  end if;
  needed := o.total_ngn - o.paid_ngn;
  if now() >= l.expires_at or needed <= 0 or o.status not in ('awaiting_payment', 'part_paid') then
    insert into public.refunds_due (source, ref_id, amount_ngn) values ('group', l.id, p_amount);
    return query select 0, p_amount, 0; return;
  end if;
  took := least(p_amount, needed);
  -- Below the ₦500 minimum (and not the last bit owed): the payment already happened, so refund it in full.
  if took < 500 and took < needed then
    insert into public.refunds_due (source, ref_id, amount_ngn) values ('group', l.id, p_amount);
    return query select 0, p_amount, 0; return;
  end if;
  insert into public.group_contributions (link_id, contributor_name, customer_id, amount_ngn, payment_ref)
  values (l.id, coalesce(nullif(trim(p_name), ''), 'A friend'), p_customer, took, p_payment_ref);
  update public.orders set paid_ngn = paid_ngn + took where id = o.id;
  if p_amount > took then insert into public.refunds_due (source, ref_id, amount_ngn) values ('group', l.id, p_amount - took); end if;
  return query select took, p_amount - took, (select count(*)::int from public.order_items where order_id = o.id and released_at is not null);
end $function$;

-- 4. Server-only functions ----------------------------------------------------------------------
revoke execute on function public.record_store_visit(uuid) from public, anon, authenticated;
grant execute on function public.record_store_visit(uuid) to service_role;

-- Trigger functions run as triggers; they never need to be callable through the API.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prorettype = 'trigger'::regtype loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- 5. store_earnings: same rows, without a SECURITY DEFINER view --------------------------------
create function public.store_earnings_for_me()
returns setof public.store_earnings_all
language sql stable security definer set search_path = '' as $$
  select e.* from public.store_earnings_all e join public.stores s on s.id = e.store_id
  where s.owner_id = (select auth.uid()) or (select public.is_staff())
$$;
revoke execute on function public.store_earnings_for_me() from public, anon;
grant execute on function public.store_earnings_for_me() to authenticated;
create or replace view public.store_earnings with (security_invoker = on) as
  select * from public.store_earnings_for_me();
revoke all on public.store_earnings from anon, authenticated;
grant select on public.store_earnings to authenticated;

-- 6a. RLS: evaluate auth.uid() and is_staff() once per query, not once per row --------------------
do $$
declare p record; q text; c text; stmt text;
  re_uid  constant text := '(?<!SELECT )auth\.uid\(\)';
  re_staff constant text := '(?<!SELECT )(?<![\w.])is_staff\(\)';
begin
  for p in select tablename, policyname, qual, with_check from pg_policies
           where schemaname = 'public' and (coalesce(qual, '') ~ re_uid or coalesce(with_check, '') ~ re_uid or coalesce(qual, '') ~ re_staff or coalesce(with_check, '') ~ re_staff)
  loop
    q := regexp_replace(regexp_replace(p.qual, re_uid, '(select auth.uid())', 'g'), re_staff, '(select public.is_staff())', 'g');
    c := regexp_replace(regexp_replace(p.with_check, re_uid, '(select auth.uid())', 'g'), re_staff, '(select public.is_staff())', 'g');
    stmt := format('alter policy %I on public.%I', p.policyname, p.tablename);
    if q is not null then stmt := stmt || ' using (' || q || ')'; end if;
    if c is not null then stmt := stmt || ' with check (' || c || ')'; end if;
    execute stmt;
  end loop;
end $$;

-- 6b. One SELECT policy per table: the "manage" policies cover writes only. Every table's read policy
--     already lets staff (or the store owner) read everything, so nobody loses access.
do $$
declare r record; p record; roles text;
begin
  for r in select * from (values
    ('categories',      'Super admin and finance manage categories'),
    ('coupons',         'coupons: staff manage'),
    ('pickup_stations', 'stations: staff manage'),
    ('product_skus',    'Catalogue staff manage SKUs'),
    ('products',        'Catalogue staff manage products'),
    ('sale_events',     'events: staff manage'),
    ('store_products',  'store products: owner manages')
  ) as t(tbl, pol)
  loop
    select * into p from pg_policies where schemaname = 'public' and tablename = r.tbl and policyname = r.pol and cmd = 'ALL';
    if p.policyname is null then continue; end if;
    roles := array_to_string(p.roles, ', ');
    execute format('create policy %I on public.%I for insert to %s with check (%s)', r.pol || ' (add)', r.tbl, roles, coalesce(p.with_check, p.qual));
    execute format('create policy %I on public.%I for update to %s using (%s) with check (%s)', r.pol || ' (edit)', r.tbl, roles, p.qual, coalesce(p.with_check, p.qual));
    execute format('create policy %I on public.%I for delete to %s using (%s)', r.pol || ' (remove)', r.tbl, roles, p.qual);
    execute format('drop policy %I on public.%I', r.pol, r.tbl);
  end loop;
end $$;

-- 6c. An index for every foreign key (joins, deletes and admin screens stay fast as orders grow).
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname, a.attname
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace and array_length(c.conkey, 1) = 1
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
  loop
    execute format('create index if not exists %I on %s (%I)', left(r.conname, 58) || '_idx', r.tbl, r.attname);
  end loop;
end $$;
