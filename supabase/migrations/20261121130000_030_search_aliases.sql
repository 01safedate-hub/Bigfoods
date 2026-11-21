-- 030: search that understands shoppers' words.
-- "clothes" finds every clothing item, "footwear" every shoe, "kitchen" the kitchen things, and so on:
-- each word links to categories and to extra words that mean the same thing. Staff can add rows any time.

create table if not exists public.search_aliases (
  word text primary key check (word = lower(word) and char_length(word) between 2 and 40),
  categories text[] not null default '{}',   -- category slugs this word means
  also text[] not null default '{}'          -- extra words to look for in product names
);
alter table public.search_aliases enable row level security;
drop policy if exists "aliases: anyone reads" on public.search_aliases;
create policy "aliases: anyone reads" on public.search_aliases for select using (true);
drop policy if exists "aliases: staff manage" on public.search_aliases;
create policy "aliases: staff manage" on public.search_aliases for all using (public.is_staff()) with check (public.is_staff());
grant select on public.search_aliases to anon, authenticated;
grant insert, update, delete on public.search_aliases to authenticated;

insert into public.search_aliases (word, categories, also) values
  -- clothes
  ('clothes',     '{fashion}', '{dress,shirt,top,polo,jean,trouser,jogger,short,legging,skirt,jacket,hoodie,gown,set,blouse,tee}'),
  ('clothing',    '{fashion}', '{dress,shirt,top,polo,jean,trouser,jogger,short,legging,skirt,jacket,hoodie,gown,set}'),
  ('cloth',       '{fashion}', '{dress,shirt,top,polo,jean,trouser,jogger}'),
  ('wear',        '{fashion}', '{}'),
  ('wears',       '{fashion}', '{}'),
  ('outfit',      '{fashion}', '{set,dress}'),
  ('outfits',     '{fashion}', '{set,dress}'),
  ('fashion',     '{fashion,bags,shoes,jewellery}', '{}'),
  ('apparel',     '{fashion}', '{}'),
  ('gown',        '{fashion}', '{dress,gown,maxi}'),
  ('gowns',       '{fashion}', '{dress,gown,maxi}'),
  ('dress',       '{fashion}', '{gown}'),
  ('dresses',     '{fashion}', '{gown}'),
  ('top',         '{fashion}', '{blouse,tee,cami,shirt}'),
  ('tops',        '{fashion}', '{blouse,tee,cami,shirt,top}'),
  ('shirt',       '{fashion}', '{tee,polo,top}'),
  ('shirts',      '{fashion}', '{tee,polo,top}'),
  ('tshirt',      '{fashion}', '{tee,t-shirt,top}'),
  ('polo',        '{fashion}', '{polo}'),
  ('polos',       '{fashion}', '{polo}'),
  ('trousers',    '{fashion}', '{pant,trouser,jogger,jean,chino}'),
  ('pants',       '{fashion}', '{pant,trouser,jogger,jean,chino}'),
  ('joggers',     '{fashion}', '{jogger,sweatpant,track}'),
  ('jeans',       '{fashion}', '{jean,denim}'),
  ('shorts',      '{fashion}', '{short}'),
  ('leggings',    '{fashion}', '{legging,yoga,tight}'),
  ('hat',         '{fashion}', '{hat,cap,beanie}'),
  ('hats',        '{fashion}', '{hat,cap,beanie}'),
  ('cap',         '{fashion}', '{cap,hat}'),
  ('caps',        '{fashion}', '{cap,hat}'),
  ('facecap',     '{fashion}', '{cap,baseball}'),
  ('native',      '{fashion}', '{kaftan,agbada,ankara,senator}'),
  ('ankara',      '{fashion}', '{ankara,print,african}'),
  ('underwear',   '{fashion}', '{brief,boxer,bra,panty,lingerie}'),
  ('accessories', '{fashion,jewellery,audio}', '{belt,sunglass,scarf,cap,hat}'),
  -- shoes
  ('shoes',       '{shoes}', '{sneaker,sandal,slipper,heel,boot,loafer,slide}'),
  ('shoe',        '{shoes}', '{sneaker,sandal,slipper,heel,boot,loafer,slide}'),
  ('footwear',    '{shoes}', '{}'),
  ('footwears',   '{shoes}', '{}'),
  ('sneakers',    '{shoes}', '{sneaker,trainer,running}'),
  ('canvas',      '{shoes}', '{sneaker,canvas}'),
  ('slippers',    '{shoes}', '{slipper,slide,flip}'),
  ('slides',      '{shoes}', '{slide,slipper}'),
  ('sandals',     '{shoes}', '{sandal}'),
  ('heels',       '{shoes}', '{heel,pump,stiletto}'),
  ('boots',       '{shoes}', '{boot}'),
  -- bags
  ('bag',         '{bags}', '{handbag,purse,tote,backpack}'),
  ('bags',        '{bags}', '{handbag,purse,tote,backpack}'),
  ('handbag',     '{bags}', '{handbag,purse,tote}'),
  ('purse',       '{bags}', '{purse,handbag,wallet}'),
  ('luggage',     '{bags}', '{suitcase,trolley,luggage}'),
  ('box',         '{bags}', '{suitcase,luggage}'),
  -- hair & beauty
  ('wig',         '{hair}', '{wig,lace,frontal,bob}'),
  ('wigs',        '{hair}', '{wig,lace,frontal,bob}'),
  ('hair',        '{hair}', '{wig,bundle,lace}'),
  ('attachment',  '{hair}', '{braid,crochet,attachment}'),
  ('beauty',      '{beauty}', '{}'),
  ('makeup',      '{beauty}', '{lipstick,foundation,palette,lash}'),
  ('perfume',     '{beauty}', '{perfume,parfum,fragrance,oud}'),
  ('perfumes',    '{beauty}', '{perfume,parfum,fragrance,oud}'),
  ('cream',       '{beauty}', '{cream,lotion,serum}'),
  -- jewellery & watches
  ('jewelry',     '{jewellery}', '{}'),
  ('jewellery',   '{jewellery}', '{}'),
  ('watch',       '{jewellery,audio}', '{watch}'),
  ('watches',     '{jewellery,audio}', '{watch}'),
  -- phones & gadgets
  ('phone',       '{gadgets}', '{iphone,smartphone,android}'),
  ('phones',      '{gadgets}', '{iphone,smartphone,android}'),
  ('iphone',      '{gadgets}', '{iphone}'),
  ('iphones',     '{gadgets}', '{iphone}'),
  ('android',     '{gadgets}', '{android}'),
  ('gadget',      '{gadgets,audio}', '{}'),
  ('gadgets',     '{gadgets,audio}', '{}'),
  ('electronics', '{gadgets,audio}', '{}'),
  ('laptop',      '{gadgets}', '{laptop,notebook,elitebook,surface}'),
  ('laptops',     '{gadgets}', '{laptop,notebook,elitebook,surface}'),
  ('case',        '{audio}', '{case,cover}'),
  ('cases',       '{audio}', '{case,cover}'),
  ('pouch',       '{audio}', '{case,cover}'),
  ('charger',     '{audio}', '{charger,adapter,cable}'),
  ('chargers',    '{audio}', '{charger,adapter,cable}'),
  ('earpiece',    '{audio}', '{earbud,earphone,headphone}'),
  ('earbuds',     '{audio}', '{earbud,earphone}'),
  ('headphones',  '{audio}', '{headphone,headset}'),
  ('speaker',     '{audio}', '{speaker}'),
  ('speakers',    '{audio}', '{speaker}'),
  ('glasses',     '{audio,fashion}', '{glass,sunglass}'),
  -- home
  ('kitchen',     '{home}', '{kitchen,cook,blender,chopper,utensil,pot,pan,jar,knife}'),
  ('home',        '{home}', '{}'),
  ('bedding',     '{home}', '{sheet,duvet,comforter,pillow,bed}'),
  ('bedsheet',    '{home}', '{sheet,duvet,pillowcase}'),
  ('solar',       '{home,audio}', '{solar}'),
  ('light',       '{home}', '{light,lamp,led}'),
  ('lights',      '{home}', '{light,lamp,led}'),
  ('fan',         '{home}', '{fan}'),
  ('decor',       '{home}', '{decor,decoration,flower}'),
  ('wedding',     '{fashion,home}', '{wedding,bridal,veil}'),
  -- kids, furniture, machines
  ('kids',        '{kids}', '{kid,child,baby,toy}'),
  ('baby',        '{kids}', '{baby,infant}'),
  ('toys',        '{kids}', '{toy}'),
  ('furniture',   '{furniture}', '{}'),
  ('machine',     '{machines}', '{}'),
  ('machines',    '{machines}', '{}')
on conflict (word) do update set categories = excluded.categories, also = excluded.also;

-- Word matches rank first; products from linked categories follow, best sellers first.
-- "men" / "women" / "male" / "female" narrow the results to products that say so.
create or replace function public.search_products(q text, lim int default 60)
returns table (slug text, rank real)
language sql stable security invoker set search_path = public, extensions as $$
  with input as (
    select trim(q) as q, lower(trim(q)) as lq, websearch_to_tsquery('english', trim(q)) as tsq
  ),
  words as (
    select distinct w from input, regexp_split_to_table(lower(input.q), '[^a-z0-9]+') w where char_length(w) >= 2
  ),
  linked as (
    select a.* from public.search_aliases a join words on a.word = words.w or a.word = words.w || 's' or a.word || 's' = words.w
  ),
  cats as (select distinct unnest(categories) c from linked),
  -- Any of the shopper's words or their linked words (OR), for ranking and wider matching.
  anyq as (
    -- Prefix matching only for longer words, so "cap" doesn't pull in "capacity".
    select to_tsquery('english', string_agg(distinct quote_literal(t) || case when char_length(t) >= 5 then ':*' else '' end, ' | ')) as tsq
    from (select w as t from words where w !~ '^(men|mens|man|male|women|womens|woman|female|ladies|lady|for|and|the|with)$'
          union select unnest(also) from linked) x
    where t ~ '^[a-z0-9-]+$'
  ),
  who as (
    select case
      when exists (select 1 from words where w in ('women', 'womens', 'woman', 'female', 'ladies', 'lady')) then 'women'
      when exists (select 1 from words where w in ('men', 'mens', 'man', 'male')) then 'men'
    end as g
  )
  select p.slug,
         (ts_rank(p.search_doc, i.tsq) * 3
          + coalesce(ts_rank(p.search_doc, a.tsq), 0)
          + similarity(p.title, i.q)
          + case when c.slug in (select c from cats) then 0.2 else 0 end)::real as rank
  from public.products p
  join input i on true
  left join anyq a on true
  left join public.categories c on c.id = p.category_id
  cross join who
  where char_length(i.q) between 2 and 120
    and p.status in ('active', 'sold_out')
    and (
      p.search_doc @@ i.tsq
      or word_similarity(i.q, p.title) > 0.35
      or p.title ilike '%' || i.q || '%'
      or (a.tsq is not null and p.search_doc @@ a.tsq and (not exists (select 1 from cats) or c.slug in (select c from cats)))
      or c.slug in (select c from cats)
      or c.name ilike '%' || i.q || '%'
    )
    and (
      who.g is null
      or (who.g = 'women' and p.title !~* '\m(men|mens|man|male|boys?)\M')
      or (who.g = 'men' and p.title !~* '\m(women|womens|woman|female|ladies|lady|girls?|bridal|bra)\M'
          and (p.title ~* '\m(men|mens|man|male|unisex|boys?)\M' or c.slug not in ('fashion', 'shoes', 'bags')))
    )
  order by rank desc, p.sale_count desc
  limit least(greatest(lim, 1), 200)
$$;
grant execute on function public.search_products(text, int) to anon, authenticated;
