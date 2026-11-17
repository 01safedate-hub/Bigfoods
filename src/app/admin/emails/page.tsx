import type { Metadata } from "next";
import Link from "next/link";
import { TEMPLATES } from "@/emails/templates";
import { getOutbox } from "@/lib/data/admin";
import { renderEmail } from "@/lib/email/render";
import { checkStaff } from "@/lib/supabase/auth";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Emails & notifications" };

const WHEN: Record<string, string> = {
  welcome: "Someone signs up", order_placed: "An order is placed", payment_received: "A part payment arrives", payment_complete: "An order is fully paid",
  order_bought: "Every item is bought", order_shipped: "Its state is dispatched", order_ready: "10 days after shipping", order_cancelled: "An order is cancelled",
  order_refunded: "A shipped order is refunded", plan_cancelled: "A plan is 14 days overdue", instalment_due: "48 hours before a payment is due",
  instalment_late: "3 days after a missed payment", plan_final_warning: "2 days before a plan is cancelled", group_contribution: "Someone chips in to a link",
  group_expiring: "24 hours before a link closes", question_answered: "Staff answer a question", draw_won: "Someone wins the Friday draw",
  wallet_credit: "A Group pay refund lands", midnight_drop: "11:30pm daily (opted-in only)",
};

export default async function EmailsPage({ searchParams }: PageProps<"/admin/emails">) {
  const sp = await searchParams;
  const pick = typeof sp.t === "string" && sp.t in TEMPLATES ? sp.t : "order_placed";
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const t = TEMPLATES[pick];
  const [preview, s] = await Promise.all([renderEmail(pick, t.sample, t.marketing ? "https://fastchina.shop/unsubscribe" : undefined), checkStaff()]);
  const outbox = s.ok && !s.demo ? await getOutbox(status) : null;
  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">Emails &amp; notifications</h1>
        <p className="text-[#5B6170]">Every email is queued by the database and sent through Resend within a minute. Customers also get each one as an in-app notification. Offer emails only go to people who opted in.</p>
      </div>

      <section className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <nav aria-label="Templates" className="flex max-h-[640px] flex-col overflow-y-auto rounded-lg border border-[#E3E5EA] bg-white">
          {Object.entries(TEMPLATES).map(([k, v]) => (
            <Link key={k} href={`/admin/emails?t=${k}`} aria-current={k === pick ? "page" : undefined} className={`border-t border-[#EEF0F3] px-3 py-2.5 first:border-0 ${k === pick ? "bg-[#F4F5F7] font-bold" : ""}`}>
              <span className="block text-[13px]">{v.subject(v.sample)}{v.marketing ? " · offer" : ""}</span>
              <span className="text-xs font-normal text-[#5B6170]">{WHEN[k] ?? k}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-[#E3E5EA] bg-white p-3 text-[13px]">
            <strong>Subject:</strong> {preview.subject}
          </div>
          <iframe title={`Preview: ${pick}`} srcDoc={preview.html} sandbox="" className="h-[600px] w-full rounded-lg border border-[#E3E5EA] bg-white" />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold">Sent log</h2>
        {!outbox && <p className="text-[#5B6170]">Connect the database to see sent emails.</p>}
        {outbox && (
          <>
            <div className="flex gap-2 text-sm">
              {(["pending", "sent", "failed"] as const).map((k) => (
                <Link key={k} href={`/admin/emails?t=${pick}&status=${k}`} className={`rounded-full px-3 py-1 ${status === k ? "bg-ink text-white" : "bg-white"}`}>{k} · {outbox.counts[k]}</Link>
              ))}
            </div>
            <div className="flex flex-col rounded-lg border border-[#E3E5EA] bg-white">
              {outbox.rows.length === 0 && <p className="p-3.5 text-[#5B6170]">Nothing here.</p>}
              {outbox.rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#EEF0F3] p-3 first:border-0 text-[13px]">
                  <span className="min-w-0 flex-1 truncate">{r.to_email}</span>
                  <span className="text-[#5B6170]">{r.template}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === "sent" ? "bg-success-soft text-success" : r.status === "failed" ? "bg-[#FDECEC] text-[#B42318]" : "bg-[#F4F5F7]"}`}>{r.status}</span>
                  {r.status === "failed" && <RetryButton id={r.id} />}
                  {r.last_error && <span className="w-full truncate text-xs text-[#B42318]">{r.last_error}</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
