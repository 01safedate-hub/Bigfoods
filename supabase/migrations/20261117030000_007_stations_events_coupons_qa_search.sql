-- 007: five storefront features that move from hard-coded lists into the database.
--   1. pickup_stations  – Jumia pickup stations (replace the placeholders with the official list)
--   2. sale_events      – sale calendar; drives the site theme and event banner automatically
--   3. coupons          – claimable coupon cards; the checkout quote reads rules from here
--   4. product_questions – product Q&A, answered by staff
--   5. search_products() – ranked full-text + typo-tolerant product search

create extension if not exists pg_trgm with schema extensions;

-- 1. Pickup stations ---------------------------------------------------------
create table public.pickup_stations (
  id text primary key,                       -- e.g. 'lag-ikeja-1'
  state text not null,
  area text not null,
  name text not null,
  address text,
  hours text,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index pickup_stations_state_idx on public.pickup_stations (state) where active;
alter table public.pickup_stations enable row level security;
create policy "stations: anyone reads active" on public.pickup_stations for select using (active or public.is_staff());
create policy "stations: staff manage" on public.pickup_stations for all using (public.is_staff()) with check (public.is_staff());
grant select on public.pickup_stations to anon, authenticated;
grant insert, update, delete on public.pickup_stations to authenticated;

insert into public.pickup_stations (id, state, area, name, hours, sort) values
  ('lag-ikeja-1', 'Lagos', 'Ikeja', 'Jumia Pickup Station, Ikeja 1', 'Mon–Sat 8am–7pm', 1),
  ('lag-ikeja-2', 'Lagos', 'Ikeja', 'Jumia Pickup Station, Ikeja 2', 'Mon–Sat 9am–6pm', 2),
  ('lag-lekki-1', 'Lagos', 'Lekki', 'Jumia Pickup Station, Lekki 1', 'Mon–Sat 8am–7pm', 3),
  ('lag-yaba-1', 'Lagos', 'Yaba', 'Jumia Pickup Station, Yaba 1', 'Mon–Fri 8am–6pm', 4),
  ('fct-wuse-1', 'FCT Abuja', 'Wuse', 'Jumia Pickup Station, Wuse 1', 'Mon–Sat 8am–6pm', 5),
  ('riv-ph-1', 'Rivers', 'Port Harcourt', 'Jumia Pickup Station, Port Harcourt 1', 'Mon–Sat 8am–6pm', 6),
  ('oyo-ibadan-1', 'Oyo', 'Ibadan', 'Jumia Pickup Station, Ibadan 1', 'Mon–Sat 8am–6pm', 7);
comment on table public.pickup_stations is 'Placeholder rows until the official Jumia list is imported.';

-- 2. Sale calendar -----------------------------------------------------------
create table public.sale_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null,
  theme text not null check (theme in ('everyday', 'black-friday', 'gadget-hunt', 'christmas', 'valentine')),
  kicker text not null,
  title text not null,                       -- may contain a line break
  sub text not null,
  color text not null default '#111111',
  early_access_days int not null default 0 check (early_access_days between 0 and 30),
  active boolean not null default true,
  check (ends_on >= starts_on)
);
alter table public.sale_events enable row level security;
create policy "events: anyone reads" on public.sale_events for select using (active or public.is_staff());
create policy "events: staff manage" on public.sale_events for all using (public.is_staff()) with check (public.is_staff());
grant select on public.sale_events to anon, authenticated;
grant insert, update, delete on public.sale_events to authenticated;

insert into public.sale_events (name, starts_on, ends_on, theme, kicker, title, sub, color, early_access_days) values
  ('Black Friday', '2026-11-27', '2026-11-30', 'black-friday', 'BLACK FRIDAY', E'UP TO\n50% OFF', 'Midnight Drop prices on top, every night', '#111111', 14),
  ('Cyber Monday', '2026-11-30', '2026-11-30', 'black-friday', 'CYBER MONDAY', E'ONE DAY\nONLY', 'Gadgets and audio at event prices', '#4F46E5', 0),
  ('Gadget Hunt', '2026-12-04', '2026-12-10', 'gadget-hunt', 'GADGET HUNT · 4–10 DEC', E'Phones, laptops\n& drones', 'New gadget deals drop every 3 hours', '#1D4ED8', 0),
  ('Christmas Sale', '2026-12-11', '2026-12-26', 'christmas', 'CHRISTMAS · ORDER BY 10 DEC FOR AIR', E'Gifts for\neveryone', 'Group pay the family wish list', '#0F3D2E', 0),
  ('New Year Restock', '2027-01-01', '2027-01-07', 'everyday', 'NEW YEAR RESTOCK', E'Fresh from\n1688 factories', 'Shipping is always free to your pickup station', '#A27B1E', 0),
  ('Valentine', '2027-02-01', '2027-02-14', 'valentine', 'VALENTINE · 1–14 FEB', E'Love, delivered\nfrom China', 'Gifts under ₦20,000', '#B4235A', 0);

-- 3. Coupons -----------------------------------------------------------------
create table public.coupons (
  id text primary key,
  label text not null,                       -- "₦1,500 off"
  title text not null,                       -- "Everyday saver"
  rule text not null,                        -- "Orders ₦15,000+ · not on gadgets"
  amount_ngn int check (amount_ngn > 0),
  percent int check (percent between 1 and 50),
  max_off_ngn int check (max_off_ngn > 0),
  min_spend_ngn int not null default 0,
  gadget_only boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  sort int not null default 0,
  check ((amount_ngn is null) <> (percent is null)),          -- exactly one kind of discount
  check (percent is null or max_off_ngn is not null)           -- percentage coupons must be capped
);
alter table public.coupons enable row level security;
create policy "coupons: anyone reads live" on public.coupons for select
  using ((active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.is_staff());
create policy "coupons: staff manage" on public.coupons for all using (public.is_staff()) with check (public.is_staff());
grant select on public.coupons to anon, authenticated;
grant insert, update, delete on public.coupons to authenticated;

insert into public.coupons (id, label, title, rule, amount_ngn, percent, max_off_ngn, min_spend_ngn, gadget_only, sort) values
  ('welcome-500', '₦500 off', 'New customer', 'Orders ₦5,000+ · not on gadgets', 500, null, null, 5000, false, 1),
  ('save-1500', '₦1,500 off', 'Everyday saver', 'Orders ₦15,000+ · not on gadgets', 1500, null, null, 15000, false, 2),
  ('fashion-10', '10% off', 'Fashion week', 'Max ₦2,000 off', null, 10, 2000, 0, false, 3),
  ('big-5000', '₦5,000 off', 'Big basket', 'Orders ₦60,000+ · not on gadgets', 5000, null, null, 60000, false, 4),
  ('gadget-3000', '₦3,000 off gadgets', 'Gadget Hunt', 'Phones, laptops & drones ₦250,000+', 3000, null, null, 250000, true, 5);

-- 4. Product Q&A ---------------------------------------------------------------
create table public.product_questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  question text not null check (char_length(question) between 5 and 300),
  asker_name text not null default 'Customer' check (char_length(asker_name) <= 40),
  asked_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'answered', 'hidden')),
  answer text check (char_length(answer) <= 1000),
  answered_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  check (status <> 'answered' or answer is not null)
);
create index product_questions_product_idx on public.product_questions (product_id, created_at desc) where status = 'answered';
create index product_questions_pending_idx on public.product_questions (created_at) where status = 'pending';
alter table public.product_questions enable row level security;
-- Shoppers only see answered questions; new questions arrive through the server (validated, rate limited).
create policy "qa: anyone reads answered" on public.product_questions for select using (status = 'answered' or public.is_staff());
create policy "qa: staff answer" on public.product_questions for update using (public.is_staff()) with check (public.is_staff());
create policy "qa: staff delete" on public.product_questions for delete using (public.is_staff());
grant select (id, product_id, question, asker_name, answer, created_at, answered_at, status) on public.product_questions to anon, authenticated;
grant update (status, answer, answered_by, answered_at), delete on public.product_questions to authenticated;

create function public.stamp_answer() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.answer is not null and (old.answer is distinct from new.answer) then
    new.status := 'answered';
    new.answered_at := now();
    new.answered_by := coalesce(new.answered_by, auth.uid());
  end if;
  return new;
end $$;
create trigger product_questions_stamp before update on public.product_questions for each row execute function public.stamp_answer();

-- A few answered demo questions so the product page isn't empty.
insert into public.product_questions (product_id, question, asker_name, status, answer, answered_at)
select p.id, q.question, q.asker, 'answered', q.answer, now() from (values
  ('satin-cowl-neck-midi-dress', 'Does the M fit a UK 10?', 'Ada', 'Yes. M is a UK 10, bust 88–92 cm. If you are between sizes, go up one.'),
  ('amoled-android-phone-5g', 'Will it work with MTN 5G in Lagos?', 'Tunde', 'Yes. It supports the n78 band MTN uses for 5G, and Airtel and Glo 4G.'),
  ('amoled-android-phone-5g', 'Does it come with a UK plug?', 'Kemi', 'It ships with a China plug. We add a UK adapter in the box at no cost.'),
  ('body-wave-lace-front-wig-22', 'Can I bleach the knots?', 'Ife', 'Yes, it is 100% human hair. We recommend a low-volume developer.')
) as q(slug, question, asker, answer)
join public.products p on p.slug = q.slug;

-- 5. Smart search --------------------------------------------------------------
alter table public.products add column search_doc tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) stored;
create index products_search_doc_idx on public.products using gin (search_doc);
create index products_title_trgm_idx on public.products using gin (title extensions.gin_trgm_ops);
grant select (search_doc) on public.products to anon, authenticated;

-- Ranked: full-text match first, then typo-tolerant title similarity ("iphon", "lace wigg").
create function public.search_products(q text, lim int default 60)
returns table (slug text, rank real)
language sql stable security invoker set search_path = public, extensions as $$
  with input as (select trim(q) as q, websearch_to_tsquery('english', trim(q)) as tsq)
  select p.slug,
         (ts_rank(p.search_doc, i.tsq) * 2 + similarity(p.title, i.q))::real as rank
  from public.products p, input i
  where char_length(i.q) between 2 and 120
    and p.status in ('active', 'sold_out')
    and (p.search_doc @@ i.tsq or word_similarity(i.q, p.title) > 0.35 or p.title ilike '%' || i.q || '%')
  order by rank desc, p.sale_count desc
  limit least(greatest(lim, 1), 100)
$$;
grant execute on function public.search_products(text, int) to anon, authenticated;
