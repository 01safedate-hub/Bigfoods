# FastChina

Import from China, priced in Naira, delivered free to Jumia pickup stations.

One Next.js app serves two sites:

| Domain | What it is | Code |
| --- | --- | --- |
| **fastchina.shop** | Marketplace: 1688 products, Midnight Drop, Pay small small, Group pay, Cart Clear-Out, Retailer Hub (10+ pieces) | `src/app/(shop)` |
| **fastchina.store** | Dropship stores with your own domain, and wholesale sea freight with your own China address | `src/app/store` |
| `/admin` | Purchasing, dispatch by state, pricing guardrails | `src/app/admin` |

`src/proxy.ts` sends requests for `fastchina.store` to the `/store` pages, so both domains can point at the same deployment.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (marketplace), /store, /admin
npm run check      # lint + typecheck + tests + production build
```

Preview an event theme with `?theme=christmas` (also `black-friday`, `gadget-hunt`, `valentine`, `everyday`).

Requires Node 22+.

## Stack

- Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript (strict)
- Tailwind CSS 4, lucide-react icons, self-hosted Inter and Instrument Serif
- Vitest for unit tests, GitHub Actions CI
- Supabase (Postgres, Auth, Realtime, Edge Functions) for the backend, connected next

## Folder structure

```
src/
  app/
    (shop)/           marketplace routes: home, search, categories, deals, product/[slug], cart, checkout, c/[code], account
    store/            fastchina.store site
    admin/            staff back office
    fonts/            self-hosted font files (OFL)
  components/
    shop/             marketplace building blocks (header, tab bar, product card, cart provider…)
    ui/               generic pieces (info sheet, countdown, progress, icons)
  hooks/              client hooks (clock, persisted state)
  lib/
    pricing/          pricing engine + guardrails (+ tests). The same logic runs in the edge functions.
    catalog/          sample products, categories, coupons, pickup stations (replaced by Supabase tables)
    content/          plain-language explainers behind every ⓘ button
    events.ts         sale calendar and event themes
    time.ts           Lagos-time helpers: Midnight Drop window, Friday draw, flash blocks
  proxy.ts            domain routing
docs/                 business rules and architecture notes
```

## Business rules in code

Read [`docs/pricing-and-promotions.md`](docs/pricing-and-promotions.md) and [`docs/dropshipping.md`](docs/dropshipping.md). The tests in `src/lib/pricing/engine.test.ts` check every catalogue item against every promotion, coupon, quantity and points combination and fail if any of them would sell below the profit floor.

## Status

The front end is complete and runs on sample data. Next steps: Supabase schema and edge functions (1688 import, pricing, purchase list, Midnight Drop, event scheduler, group-pay realtime, auto-delivery after 10 days), payments, and auth for customers, sellers and staff roles.

## Backend (Supabase)

- `supabase/migrations/`: database schema, applied in order. Roles and profiles, pricing settings, categories, products and SKUs. Prices are calculated in the database (mirroring `src/lib/pricing`), and customers can only read selling prices: costs, margins and suppliers are column-restricted.
- `supabase/functions/tmapi/`: the only place that talks to TMAPI (1688 data). Actions: `search`, `import`, `check_images`, `probe_images`. Needs the `TMAPI_KEY` secret. Staff JWT or the internal task token required.
- 1688 images block hotlinking (403 when the Referer is our domain), so product images are copied into the `product-images` storage bucket on import.
