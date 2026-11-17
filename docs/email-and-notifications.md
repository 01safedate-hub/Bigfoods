# Email and notifications

## How it works
1. Something happens in the database (order placed, payment, dispatch, a reminder is due…).
2. `public.notify()` writes an in-app notification and, if allowed, a row in `email_outbox`.
   Every message has a `dedupe_key`, so retries and repeated jobs never send twice.
3. Every minute `pg_cron` runs `kick_email_sender()`, which calls `POST {site_url}/api/notify/drain`
   with the internal task token. The site renders the React Email template and sends it with Resend
   (`Idempotency-Key = outbox id`). Failures retry after 2, 4, 8, 16 minutes, then stop as `failed`
   (Admin → Emails & notifications → Retry).
4. Reminders (`queue_reminders()`, every 30 min): payment due in 48h, 3 days late, 2 days before
   cancellation, Group pay link closing in 24h, Midnight Drop at 11:30pm (opted-in only).

## Switch it on
1. Resend: add and verify the domain `fastchina.shop` (SPF, DKIM, and add a DMARC record), create an API key.
2. Hosting env vars: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SITE_URL`, `UNSUBSCRIBE_SECRET`.
3. Tell the database where the site is:
   `insert into public.app_settings (key, value) values ('site_url', 'https://fastchina.shop');`
4. Sign-in codes are sent by Supabase Auth. In Supabase → Authentication:
   - SMTP settings: host `smtp.resend.com`, port `465`, user `resend`, password = the Resend API key,
     sender `FastChina <login@fastchina.shop>`.
   - Emails → Magic link: paste `supabase/templates/sign-in-code.html`, subject `Your FastChina code: {{ .Token }}`.

## Templates (src/emails/templates.tsx)
welcome, order_placed, payment_received, payment_complete, order_bought, order_shipped, order_ready,
order_cancelled, order_refunded, plan_cancelled, instalment_due, instalment_late, plan_final_warning,
group_contribution, group_expiring, question_answered, draw_won, wallet_credit, midnight_drop (offer).
Preview them all in Admin → Emails & notifications. Tests render every template (`npm test`).

## Consent (NDPA 2023)
Order and payment emails are on by default (they're about the customer's money).
Offer emails are opt-in only, carry a signed unsubscribe link and one-click `List-Unsubscribe` headers.
