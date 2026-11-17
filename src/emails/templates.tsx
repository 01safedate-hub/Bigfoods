import type { ReactElement } from "react";
import { Btn, H, Items, Layout, Note, P, SITE, Summary } from "./ui";

/** Data stored with each queued email (from the database's notify() calls). */
export type EmailData = Record<string, unknown>;

const s = (d: EmailData, k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
const n = (d: EmailData, k: string) => (typeof d[k] === "number" ? (d[k] as number) : Number(d[k] ?? 0) || 0);
const items = (d: EmailData) => (Array.isArray(d.items) ? (d.items as { title: string; variant?: string | null; qty: number }[]) : []);
const ngn = (v: number) => `₦${Math.round(v).toLocaleString("en-NG")}`;
const day = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Lagos" }) : "");
const track = (d: EmailData) => `/track?code=${s(d, "code")}`;
const PAY: Record<string, string> = { full: "Pay in full", small: "Pay small small", group: "Group pay" };

interface Template {
  subject: (d: EmailData) => string;
  preview: (d: EmailData) => string;
  body: (d: EmailData) => ReactElement;
  /** Offers and promotions: only sent to people who opted in, always with an unsubscribe link. */
  marketing?: boolean;
  /** Example data for previews and tests. */
  sample: EmailData;
}

const ORDER = { code: "737012B0", total: 36_600, paid: 36_600, pay_mode: "full", station: "Jumia Pickup Station, Ikeja 1", items: [{ title: "Satin cowl-neck midi dress", variant: "Wine / M", qty: 1 }, { title: "Men’s steel quartz watch", variant: "Green", qty: 1 }] };

export const TEMPLATES: Record<string, Template> = {
  welcome: {
    subject: () => "Welcome to FastChina",
    preview: () => "Free shipping on everything, and ₦500 off your first order.",
    body: () => (
      <>
        <H>Welcome to FastChina</H>
        <P>We buy straight from factories in China and deliver to your Jumia pickup station. Shipping is free on everything, and customs clearing is included in the price.</P>
        <Summary rows={[["First-order coupon", "₦500 off", "sale"], ["Midnight Drop", "12am–4am daily"], ["Pay small small", "0% weekly payments"]]} />
        <Btn href="/deals" tone="sale">START SHOPPING</Btn>
        <P muted>Tip: check in daily on your account page for free points. 100 points = ₦100 off.</P>
      </>
    ),
    sample: {},
  },

  order_placed: {
    subject: (d) => `Order #${s(d, "code")} placed`,
    preview: (d) => (s(d, "pay_mode") === "group" ? "Share your Group pay link to get it paid." : `Total ${ngn(n(d, "total"))}. Here’s what happens next.`),
    body: (d) => {
      const plan = Array.isArray(d.instalments) ? (d.instalments as { n: number; due: string; amount: number }[]) : [];
      const mode = s(d, "pay_mode");
      return (
        <>
          <H>Thanks, your order is in</H>
          <P>Order <strong>#{s(d, "code")}</strong> · {PAY[mode] ?? mode}</P>
          <Items items={items(d)} />
          <Summary rows={[["Total", ngn(n(d, "total")), "bold"], ["Delivery", "Free to your pickup station"], ["Pickup station", s(d, "station")]]} />
          {mode === "small" && plan.length > 0 && (
            <Summary rows={plan.slice(0, 4).map((i) => [i.n === 1 ? "Today" : day(i.due), ngn(i.amount)] as [string, string])} />
          )}
          {mode === "group" && s(d, "link_code") && (
            <Note>Share this link with friends and family: <strong>{SITE.replace("https://", "")}/c/{s(d, "link_code")}</strong>. It stays open for 7 days, and items ship as soon as each one is paid for.</Note>
          )}
          <Btn href={mode === "group" ? `/c/${s(d, "link_code")}` : track(d)}>{mode === "group" ? "OPEN YOUR LINK" : "VIEW ORDER"}</Btn>
          <P muted>We order from the factory as soon as your order is fully paid. Air items arrive in about 10–18 days; sea items in 90+ days.</P>
        </>
      );
    },
    sample: { ...ORDER, pay_mode: "small", total: 19_736, instalments: [{ n: 1, due: "2026-11-17T10:00:00Z", amount: 5_036 }, { n: 2, due: "2026-11-24T10:00:00Z", amount: 4_900 }, { n: 3, due: "2026-12-01T10:00:00Z", amount: 4_900 }, { n: 4, due: "2026-12-08T10:00:00Z", amount: 4_900 }] },
  },

  payment_received: {
    subject: (d) => `${ngn(n(d, "amount"))} received · #${s(d, "code")}`,
    preview: (d) => `${ngn(n(d, "total") - n(d, "paid"))} to go.`,
    body: (d) => (
      <>
        <H>Payment received</H>
        <P>We’ve received {ngn(n(d, "amount"))} for order #{s(d, "code")}.</P>
        <Summary rows={[["Paid so far", ngn(n(d, "paid")), "success"], ["Still to pay", ngn(n(d, "total") - n(d, "paid")), "bold"], ["Order total", ngn(n(d, "total"))]]} />
        <Btn href={track(d)}>VIEW ORDER</Btn>
      </>
    ),
    sample: { code: "4C19AE02", amount: 4_900, paid: 9_936, total: 19_736, pay_mode: "small" },
  },

  payment_complete: {
    subject: (d) => `Fully paid · #${s(d, "code")}`,
    preview: () => "We’re ordering your items from the factory now.",
    body: (d) => (
      <>
        <H>You’re fully paid 🎉</H>
        <P>Order #{s(d, "code")} is paid in full. We’re ordering your items from the factory now.</P>
        <Items items={items(d)} />
        <Summary rows={[["Total paid", ngn(n(d, "total")), "success"], ["Pickup station", s(d, "station")]]} />
        <Btn href={track(d)}>TRACK ORDER</Btn>
      </>
    ),
    sample: ORDER,
  },

  order_bought: {
    subject: (d) => `Bought from the factory · #${s(d, "code")}`,
    preview: () => "Next stop: our China warehouse for a photo check.",
    body: (d) => (
      <>
        <H>We’ve bought your items</H>
        <P>Everything in order #{s(d, "code")} has been bought from the factory. It’s on its way to our China warehouse, where we check and photograph it before it ships.</P>
        <Items items={items(d)} />
        <Btn href={track(d)}>TRACK ORDER</Btn>
      </>
    ),
    sample: ORDER,
  },

  order_shipped: {
    subject: (d) => `On the way · #${s(d, "code")}`,
    preview: (d) => `It’ll be at ${s(d, "station") || "your pickup station"} in about 10 days.`,
    body: (d) => {
      const by = s(d, "shipped_at") ? day(new Date(Date.parse(s(d, "shipped_at")) + 10 * 86_400_000).toISOString()) : "";
      return (
        <>
          <H>Your order is on the way</H>
          <P>Order #{s(d, "code")} has left China.</P>
          <Summary rows={[["Pickup station", s(d, "station")], ["Expected by", by || "about 10 days", "bold"]]} />
          <Items items={items(d)} />
          <Note>We’ll text you a pickup code when it arrives. Bring the code and an ID to the station.</Note>
          <Btn href={track(d)}>TRACK ORDER</Btn>
        </>
      );
    },
    sample: { ...ORDER, shipped_at: "2026-11-17T10:00:00Z" },
  },

  order_ready: {
    subject: (d) => `Ready for pickup · #${s(d, "code")}`,
    preview: (d) => `At ${s(d, "station")}. Bring your pickup code and an ID.`,
    body: (d) => (
      <>
        <H>Ready for pickup</H>
        <P>Order #{s(d, "code")} is waiting for you at <strong>{s(d, "station")}</strong>.</P>
        <Note tone="success">Bring your pickup code (sent by SMS) and a photo ID. Stations keep parcels for 7 days.</Note>
        <Items items={items(d)} />
        <Btn href={track(d)}>VIEW ORDER</Btn>
        <P muted>Love it? Leave a photo review and earn points.</P>
      </>
    ),
    sample: ORDER,
  },

  order_cancelled: {
    subject: (d) => `Order #${s(d, "code")} cancelled`,
    preview: (d) => (n(d, "refund") > 0 ? `${ngn(n(d, "refund"))} is back in your wallet.` : "Nothing was charged."),
    body: (d) => (
      <>
        <H>Order cancelled</H>
        <P>Order #{s(d, "code")} has been cancelled.{s(d, "reason").startsWith("auto: group") ? " The Group pay link closed before anything was fully paid." : ""}</P>
        {n(d, "refund") > 0 ? (
          <Summary rows={[["Returned to your wallet", ngn(n(d, "refund")), "success"]]} />
        ) : (
          <P>Nothing was charged.</P>
        )}
        <P muted>Any coupon or points you used on this order are yours to use again.</P>
        <Btn href="/">KEEP SHOPPING</Btn>
      </>
    ),
    sample: { ...ORDER, refund: 22_900, reason: "by staff" },
  },

  order_refunded: {
    subject: (d) => `Refund for #${s(d, "code")}`,
    preview: (d) => `${ngn(n(d, "refund"))} is back in your wallet.`,
    body: (d) => (
      <>
        <H>You’ve been refunded</H>
        <P>We’re sorry, order #{s(d, "code")} didn’t reach your pickup station. We’ve refunded you in full.</P>
        <Summary rows={[["Refund", ngn(n(d, "refund")), "success"], ["Paid to", "Your FastChina wallet"]]} />
        <P muted>Prefer it back to your card or bank? Reply to this email.</P>
        <Btn href="/account">VIEW WALLET</Btn>
      </>
    ),
    sample: { ...ORDER, refund: 36_600 },
  },

  plan_cancelled: {
    subject: (d) => `Pay small small plan cancelled · #${s(d, "code")}`,
    preview: (d) => `${ngn(n(d, "refund"))} is back in your wallet.`,
    body: (d) => (
      <>
        <H>Your plan was cancelled</H>
        <P>A payment for order #{s(d, "code")} was 14 days overdue, so the plan has been cancelled. Nothing had been bought yet.</P>
        <Summary rows={[["Returned to your wallet", ngn(n(d, "refund")), "success"]]} />
        <P>You can use it on your next order, or start a new plan any time.</P>
        <Btn href="/cart">GO TO CART</Btn>
      </>
    ),
    sample: { code: "4C19AE02", refund: 9_936 },
  },

  instalment_due: {
    subject: (d) => `Payment ${n(d, "n")} of ${n(d, "weeks")} due ${day(s(d, "due"))}`,
    preview: (d) => `${ngn(n(d, "amount"))} for order #${s(d, "code")}.`,
    body: (d) => (
      <>
        <H>Your next payment is due soon</H>
        <P>A friendly reminder for your Pay small small plan on order #{s(d, "code")}.</P>
        <Summary rows={[["Payment", `${n(d, "n")} of ${n(d, "weeks")}`], ["Due", day(s(d, "due")), "bold"], ["Amount", ngn(n(d, "amount")), "bold"], ["Paid so far", `${ngn(n(d, "paid"))} of ${ngn(n(d, "total"))}`]]} />
        <Btn href={track(d)} tone="sale">PAY {ngn(n(d, "amount"))}</Btn>
        <P muted>Your price stays locked while your plan is on track.</P>
      </>
    ),
    sample: { code: "4C19AE02", n: 2, weeks: 4, due: "2026-11-24T10:00:00Z", amount: 4_900, paid: 5_036, total: 19_736 },
  },

  instalment_late: {
    subject: (d) => `Payment overdue · #${s(d, "code")}`,
    preview: (d) => `Pay ${ngn(n(d, "overdue"))} by ${day(s(d, "cancel_at"))} to keep your price.`,
    body: (d) => (
      <>
        <H>A payment is overdue</H>
        <P>Your Pay small small plan for order #{s(d, "code")} is behind.</P>
        <Summary rows={[["Overdue", ngn(n(d, "overdue")), "sale"], ["Pay by", day(s(d, "cancel_at")), "bold"]]} />
        <Note>If it isn’t paid by then, the plan is cancelled and everything you’ve paid goes back to your wallet. No fees.</Note>
        <Btn href={track(d)} tone="sale">PAY NOW</Btn>
      </>
    ),
    sample: { code: "4C19AE02", overdue: 4_900, cancel_at: "2026-12-08T10:00:00Z" },
  },

  plan_final_warning: {
    subject: (d) => `Last chance to keep order #${s(d, "code")}`,
    preview: (d) => `Your plan is cancelled on ${day(s(d, "cancel_at"))}.`,
    body: (d) => (
      <>
        <H>Last chance</H>
        <P>Your Pay small small plan for order #{s(d, "code")} will be cancelled on <strong>{day(s(d, "cancel_at"))}</strong> unless you pay {ngn(n(d, "overdue"))}.</P>
        <Btn href={track(d)} tone="sale">PAY {ngn(n(d, "overdue"))}</Btn>
        <P muted>If you can’t pay, there’s nothing to do: everything you’ve paid returns to your wallet automatically.</P>
      </>
    ),
    sample: { code: "4C19AE02", overdue: 4_900, cancel_at: "2026-12-08T10:00:00Z" },
  },

  group_contribution: {
    subject: (d) => `${s(d, "name")} chipped in ${ngn(n(d, "amount"))}`,
    preview: (d) => `${ngn(n(d, "raised"))} of ${ngn(n(d, "total"))} raised for #${s(d, "code")}.`,
    body: (d) => {
      const pct = Math.min(100, Math.round((n(d, "raised") / Math.max(1, n(d, "total"))) * 100));
      return (
        <>
          <H>{s(d, "name")} chipped in!</H>
          <P>{ngn(n(d, "amount"))} towards order #{s(d, "code")}.</P>
          <Summary rows={[["Raised", `${ngn(n(d, "raised"))} · ${pct}%`, "success"], ["Still needed", ngn(Math.max(0, n(d, "total") - n(d, "raised"))), "bold"]]} />
          <Btn href={`/c/${s(d, "link_code")}`}>SEE YOUR LINK</Btn>
          <P muted>Items ship as soon as each one is fully paid.</P>
        </>
      );
    },
    sample: { code: "B7D0013F", name: "Bisi", amount: 20_000, raised: 50_000, total: 87_300, link_code: "IKEJ-9915" },
  },

  group_expiring: {
    subject: () => "Your Group pay link closes in 24 hours",
    preview: (d) => `${ngn(n(d, "total") - n(d, "raised"))} still needed.`,
    body: (d) => (
      <>
        <H>Your link closes soon</H>
        <P>Your Group pay link for order #{s(d, "code")} closes on {day(s(d, "expires_at"))}.</P>
        <Summary rows={[["Raised", ngn(n(d, "raised")), "success"], ["Still needed", ngn(n(d, "total") - n(d, "raised")), "bold"]]} />
        <Note>Share it once more: <strong>{SITE.replace("https://", "")}/c/{s(d, "link_code")}</strong>. You can also pay the rest yourself.</Note>
        <Btn href={`/c/${s(d, "link_code")}`} tone="sale">OPEN YOUR LINK</Btn>
        <P muted>When it closes, fully paid items still ship. Money that didn’t complete an item goes back to whoever paid it.</P>
      </>
    ),
    sample: { code: "B7D0013F", link_code: "IKEJ-9915", raised: 50_000, total: 87_300, expires_at: "2026-11-18T10:00:00Z" },
  },

  question_answered: {
    subject: (d) => `Your question about ${s(d, "product")} was answered`,
    preview: (d) => s(d, "answer").slice(0, 90),
    body: (d) => (
      <>
        <H>We answered your question</H>
        <P muted>{s(d, "product")}</P>
        <Summary rows={[["You asked", s(d, "question")]]} />
        <Note tone="success">{s(d, "answer")}</Note>
        <Btn href={`/product/${s(d, "slug")}#qa`}>VIEW PRODUCT</Btn>
      </>
    ),
    sample: { product: "Satin cowl-neck midi dress", slug: "satin-cowl-neck-midi-dress", question: "Is the satin see-through?", answer: "No, it’s fully lined, so it isn’t see-through." },
  },

  draw_won: {
    subject: () => "You won the Cart Clear-Out!",
    preview: (d) => `${ngn(n(d, "amount"))} is in your wallet.`,
    body: (d) => (
      <>
        <H>You won! 🎉</H>
        <P>Your cart was picked in this week’s Cart Clear-Out.</P>
        <Summary rows={[["Added to your wallet", ngn(n(d, "amount")), "success"]]} />
        <Btn href="/cart" tone="sale">CHECK OUT FOR FREE</Btn>
        <P muted>The draw is provably fair: the code behind it is published on the Deals page so anyone can check the result.</P>
      </>
    ),
    sample: { amount: 64_000 },
  },

  wallet_credit: {
    subject: (d) => `${ngn(n(d, "amount"))} added to your wallet`,
    preview: () => "Use it on your next order.",
    body: (d) => (
      <>
        <H>Money added to your wallet</H>
        <P>{s(d, "reason") === "group_refund" ? "A Group pay link closed before the next item was fully paid, so your share came back to you." : "Your wallet has been topped up."}</P>
        <Summary rows={[["Added", ngn(n(d, "amount")), "success"]]} />
        <Btn href="/account">VIEW WALLET</Btn>
      </>
    ),
    sample: { amount: 9_083, reason: "group_refund" },
  },

  midnight_drop: {
    marketing: true,
    subject: () => "Midnight Drop starts in 30 minutes 🌙",
    preview: () => "Prices fall from 12am to 4am tonight.",
    body: () => (
      <>
        <H>Midnight Drop starts soon</H>
        <P>From 12am to 4am tonight, prices fall on everything, gadgets included. Free shipping as always.</P>
        <Btn href="/deals" tone="sale">SEE TONIGHT’S PRICES</Btn>
        <P muted>Your saved items are a good place to start.</P>
      </>
    ),
    sample: { date: "2026-11-17" },
  },
};

export type TemplateName = keyof typeof TEMPLATES;

/** Builds the email for a queued message. */
export function buildEmail(name: string, data: EmailData, unsubscribeUrl?: string) {
  const t = TEMPLATES[name];
  if (!t) throw new Error(`Unknown email template: ${name}`);
  return {
    subject: t.subject(data),
    marketing: Boolean(t.marketing),
    element: (
      <Layout preview={t.preview(data)} marketing={t.marketing} unsubscribeUrl={unsubscribeUrl}>
        {t.body(data)}
      </Layout>
    ),
  };
}
