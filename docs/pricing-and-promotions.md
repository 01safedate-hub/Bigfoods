# Pricing and promotions

Source of truth: `src/lib/pricing/config.ts` and `src/lib/pricing/engine.ts`.

## How a price is built

| Part | Rule |
| --- | --- |
| Exchange rate | ₦2,100 per US$ ÷ ¥6.6664 per US$ (16 Nov 2026) → **₦315 per ¥1** |
| Goods | Factory price in ¥ × ₦315 |
| Air freight | ₦/kg × weight (*assumed ₦15,000/kg until confirmed*) |
| Clearing | ₦1,800 per kg, on every item |
| Sea freight | ₦/CBM × volume (*assumed ₦420,000/CBM*). Furniture and machines only, 90+ days |
| Jumia last-mile | ₦ per item (*assumed ₦1,500*). Covers “free shipping” |
| Profit | Category % **of goods only** (fashion 80%, hair 70%, beauty 90%, jewellery 90%, audio 90%, shoes 75%, bags 85%, home 80%, kids 80%, furniture 60%, machines 60%). Gadgets (phones, laptops, desktops, drones): 10% + ₦50,000 |
| Payment fee | 1.5% + ₦100 (waived under ₦2,500), capped at ₦2,000. Built into the price |

Freight and clearing are passed through at cost, never marked up, so light cheap items stay competitive.

## Promotions

| Promotion | Discount | Notes |
| --- | --- | --- |
| Midnight Drop | 20% of profit | 00:00–04:00 Lagos time, every night, automatic |
| Event price | 30% of profit | Black Friday, Gadget Hunt, Christmas… scheduled in `events` |
| Flash sale | 50% of profit | Limited stock, 2 per customer |
| Retailer (10+ of one product) | 40% of profit | Also the dropship seller’s cost |
| Coupon | ≤ 25% of eligible profit | One per order. Not on gadgets (gadget coupons only), not on retailer lines |
| Points | ≤ 10% of order | 100 pts = ₦100 |
| Cart Clear-Out | Fixed weekly budget | 5 carts × up to ₦50,000, ≤ 3% of last week’s profit |

## Guardrails (enforced in `quoteCart`)

1. Price promotions never add up. The lowest single price wins.
2. All discounts on an order together never exceed **50% of its planned profit**.
3. Coupons and points are trimmed to fit, and the customer is told why.
4. List prices already include last-mile and payment fees.

`engine.test.ts` runs every catalogue item × quantity × promotion × coupon × points combination and fails if profit drops below 49% of plan (1% allowed for rounding).
