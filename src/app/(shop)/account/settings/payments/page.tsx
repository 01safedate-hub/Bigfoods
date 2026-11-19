import { CreditCard, Landmark, Smartphone, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Panel, SettingsShell } from "../ui";

export const metadata: Metadata = { title: "Payment options", robots: { index: false } };

const WAYS = [
  [CreditCard, "Debit card", "Verve, Visa and Mastercard, in Naira. Card details go straight to our licensed payment processor; we never see or store your card number."],
  [Landmark, "Bank transfer", "Pay into a one-time account number generated for your order."],
  [Smartphone, "USSD", "Pay from any Nigerian bank with a short code, no internet needed."],
  [Wallet, "FastChina wallet", "Refunds and prizes land here instantly and can pay for any order."],
  [Users, "Pay small small & Group pay", "Spread a price over 4, 8 or 12 weeks at 0% interest, or split it with friends."],
] as const;

export default function PaymentsPage() {
  return (
    <SettingsShell title="Payment options">
      <Panel>
        <p className="text-[14px] text-muted">You choose how to pay at checkout. All prices are in Naira (₦) and already include shipping and customs clearing.</p>
        <ul className="flex flex-col gap-3.5">
          {WAYS.map(([Icon, t, d]) => (
            <li key={t} className="flex gap-3">
              <Icon aria-hidden size={22} strokeWidth={1.6} className="mt-0.5 shrink-0 text-success" />
              <span className="flex flex-col gap-0.5"><strong className="text-[15px]">{t}</strong><span className="text-[13px] leading-relaxed text-muted">{d}</span></span>
            </li>
          ))}
        </ul>
        <Link href="/why-fastchina#security" className="text-[13px] font-bold underline">How we keep payments safe</Link>
      </Panel>
    </SettingsShell>
  );
}
