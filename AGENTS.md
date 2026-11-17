<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## FastChina project notes

- Two domains, one app: `src/app/(shop)` = fastchina.shop, `src/app/store` = fastchina.store (routed by `src/proxy.ts`), `src/app/admin` = back office.
- All prices come from `src/lib/pricing/engine.ts`. Never hard-code a naira price; change `config.ts` instead. Run `npm test` after touching pricing: the guardrail tests must stay green.
- Anything time-based uses Lagos time helpers in `src/lib/time.ts` and the `useNow` hook (renders a placeholder until mounted, so prerendered HTML never depends on the clock).
- Every promotion section has an `<InfoButton topic=…>`; explainer copy lives in `src/lib/content/info.ts`.

### Backend map (Supabase, migrations in `supabase/migrations/`)
- 001–006: roles/profiles, pricing + catalogue (prices computed by triggers), TMAPI plumbing, display fields.
- 007: `pickup_stations`, `sale_events`, `coupons`, `product_questions`, `search_products()`.
- 008: `orders` (status machine trigger), Pay small small plans, Group pay links, Cart Clear-Out draws, profit guard; pg_cron jobs `fc-*`.
- 009: `place_order`, `track_order`, `record_purchase`, `dispatch_state`, `purchase_list` / `dispatch_by_state` views.
- 013: compliance: `hit_rate_limit`, `email_suppressions` + `record_email_event` (Resend webhook), quiet hours for reminders, `retention_cleanup` (daily), `anonymise_customer` (account deletion).
- 012: coupon rules (`coupon_redemptions`, per-customer/first-order/budget limits checked in `place_order` under locks), real points, `notify()`, `notifications`, `email_outbox`, reminders, Resend sender. See docs/email-and-notifications.md.
- 010–011: `wishlists`, `points_ledger` + `daily_checkin()`, `my_balances`, `cancel_or_refund` (once only), `set_staff_role`, `admin_dashboard()`.
- Money-moving functions are service-role only; the site calls them from server actions with `SUPABASE_SECRET_KEY`.
- The same rules live in TypeScript with tests: `src/lib/{orders,payments,draw,pricing/audit}.ts`. Keep both in step.
- Auth: passwordless OTP (`/sign-in`), session refreshed in `src/proxy.ts`, `/admin` gated by `StaffGate` (staff role).
- Without the Supabase env vars the site runs on sample data ("demo mode"); nothing is saved.

### Reliability and compliance conventions
- Every user-triggered server action is called through `attempt()` / `call()` from `src/lib/net.ts` (friendly offline/network messages).
- `useOnline()` + `<OfflineBanner />`; payments are disabled while offline. `public/sw.js` caches public pages, app files and photos only.
- `error.tsx` per section, `global-error.tsx`, `loading.tsx` skeletons, `SafeImage` for photos.
- Rate limits: `allow()` in `src/lib/rate-limit.ts` (hashed IP or user id, fails open).
- Security headers and CSP in `next.config.ts`. Data rights: export/delete in My account.
