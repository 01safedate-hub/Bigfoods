import { HelpCircle, Mail, MessageCircle, PackageSearch } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Panel, SettingsShell } from "../ui";

export const metadata: Metadata = { title: "Contact us", robots: { index: false } };

const EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@fastchina.shop";
const WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP; // e.g. 2348030000000

export default function ContactPage() {
  const rows: [typeof Mail, string, string, string][] = [
    ...(WHATSAPP ? [[MessageCircle, "WhatsApp", "Fastest replies, Mon–Sat 8am–8pm", `https://wa.me/${WHATSAPP}`] as [typeof Mail, string, string, string]] : []),
    [Mail, "Email", EMAIL, `mailto:${EMAIL}`],
    [PackageSearch, "Track an order", "Order code and the last 4 digits of your phone", "/track"],
    [HelpCircle, "Ask about a product", "Every product page has Q&A answered by our team", "/"],
  ];
  return (
    <SettingsShell title="Connect to us">
      <Panel>
        <p className="text-[14px] text-muted">We usually reply within a few hours, Monday to Saturday (Lagos time). Include your order code if it’s about an order.</p>
        <ul className="flex flex-col divide-y divide-line">
          {rows.map(([Icon, t, d, href]) => (
            <li key={t}>
              {href.startsWith("/") ? (
                <Link href={href} className="flex items-center gap-3 py-3"><Icon aria-hidden size={22} strokeWidth={1.6} /><span className="flex flex-col"><strong className="text-[15px]">{t}</strong><span className="text-[13px] text-muted">{d}</span></span></Link>
              ) : (
                <a href={href} className="flex items-center gap-3 py-3"><Icon aria-hidden size={22} strokeWidth={1.6} /><span className="flex flex-col"><strong className="text-[15px]">{t}</strong><span className="text-[13px] text-muted">{d}</span></span></a>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </SettingsShell>
  );
}
