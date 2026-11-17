-- Display fields used by the storefront, plus a demo flag so sample products are easy to remove.
alter table public.products
  add column options jsonb not null default '[]',      -- [{ "name": "Colour", "values": [{ "label": "Wine", "hex": "#6B1E2E" }] }]
  add column specs jsonb not null default '[]',        -- [["Material", "Polyester satin"], …]
  add column reviews int not null default 0,
  add column tint text,                                 -- placeholder tile colour until photos exist
  add column icon text,
  add column flash_claimed_pct int check (flash_claimed_pct between 0 and 100),
  add column is_demo boolean not null default false;

alter table public.product_skus add column sort int not null default 0;

grant select (options, specs, reviews, tint, icon, flash_claimed_pct, is_demo) on public.products to anon, authenticated;
grant select (sort) on public.product_skus to anon, authenticated;

comment on column public.products.is_demo is 'Sample catalogue rows. Delete with: delete from products where is_demo;';
