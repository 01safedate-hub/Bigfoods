import { Body, Button, Column, Container, Head, Heading, Hr, Html, Link, Preview, Row, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export const SITE = process.env.SITE_URL ?? "https://fastchina.shop";

const C = { ink: "#111111", muted: "#6B6B6B", line: "#EAEAEA", sale: "#E11D48", gold: "#F5C542", success: "#0F7B3F", soft: "#F6F6F6" };
const font = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Shared frame for every email: logo, content, footer. Built from tables, so it renders in Gmail, Outlook and phone mail apps. */
export function Layout({ preview, children, marketing, unsubscribeUrl }: { preview: string; children: ReactNode; marketing?: boolean; unsubscribeUrl?: string }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#F2F2F2", margin: 0, padding: "24px 0", fontFamily: font, color: C.ink }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#FFFFFF", borderRadius: 12, overflow: "hidden" }}>
          <Section style={{ padding: "20px 28px", borderBottom: `1px solid ${C.line}` }}>
            <Row>
              <Column style={{ width: 34 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: C.ink, color: C.gold, textAlign: "center", lineHeight: "30px", fontSize: 18, fontWeight: 900 }}>⚡</div>
              </Column>
              <Column>
                <Link href={SITE} style={{ textDecoration: "none", fontSize: 19, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>
                  <span style={{ color: C.ink }}>FAST</span>
                  <span style={{ color: C.sale }}>CHINA</span>
                </Link>
              </Column>
            </Row>
          </Section>
          <Section style={{ padding: "28px 28px 8px" }}>{children}</Section>
          <Section style={{ padding: "8px 28px 28px" }}>
            <Hr style={{ borderColor: C.line, margin: "16px 0" }} />
            <Text style={{ fontSize: 12, lineHeight: "18px", color: C.muted, margin: 0 }}>
              Free shipping to your Jumia pickup station · Pay small small at 0% · Questions? Reply to this email.
            </Text>
            <Text style={{ fontSize: 12, lineHeight: "18px", color: C.muted, margin: "8px 0 0" }}>
              <Link href={`${SITE}/account`} style={{ color: C.muted }}>My account</Link>
              {" · "}
              <Link href={`${SITE}/track`} style={{ color: C.muted }}>Track an order</Link>
              {" · "}
              <Link href={`${SITE}/legal/privacy`} style={{ color: C.muted }}>Privacy</Link>
              {marketing && unsubscribeUrl && (
                <>
                  {" · "}
                  <Link href={unsubscribeUrl} style={{ color: C.muted }}>Unsubscribe from offers</Link>
                </>
              )}
            </Text>
            <Text style={{ fontSize: 11, color: "#9A9A9A", margin: "8px 0 0" }}>FastChina · Lagos, Nigeria</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const H = ({ children }: { children: ReactNode }) => (
  <Heading as="h1" style={{ fontSize: 24, lineHeight: "30px", fontWeight: 800, margin: "0 0 12px", color: C.ink }}>{children}</Heading>
);

export const P = ({ children, muted }: { children: ReactNode; muted?: boolean }) => (
  <Text style={{ fontSize: 15, lineHeight: "23px", margin: "0 0 14px", color: muted ? C.muted : C.ink }}>{children}</Text>
);

export const Btn = ({ href, children, tone = "ink" }: { href: string; children: ReactNode; tone?: "ink" | "sale" }) => (
  <Section style={{ margin: "8px 0 20px" }}>
    <Button href={href.startsWith("http") ? href : `${SITE}${href}`} style={{ backgroundColor: tone === "sale" ? C.sale : C.ink, color: "#FFFFFF", fontSize: 14, fontWeight: 800, padding: "13px 22px", borderRadius: 8, letterSpacing: "0.02em" }}>
      {children}
    </Button>
  </Section>
);

/** Grey summary box of label/value rows. */
export const Summary = ({ rows }: { rows: [string, ReactNode, ("bold" | "sale" | "success")?][] }) => (
  <Section style={{ backgroundColor: C.soft, borderRadius: 10, padding: "12px 16px", margin: "4px 0 18px" }}>
    {rows.map(([k, v, tone], i) => (
      <Row key={i}>
        <Column style={{ fontSize: 14, color: C.muted, padding: "5px 0" }}>{k}</Column>
        <Column align="right" style={{ fontSize: 14, padding: "5px 0", fontWeight: tone ? 800 : 600, color: tone === "sale" ? C.sale : tone === "success" ? C.success : C.ink }}>{v}</Column>
      </Row>
    ))}
  </Section>
);

export const Items = ({ items }: { items: { title: string; variant?: string | null; qty: number }[] }) =>
  items.length ? (
    <Section style={{ margin: "0 0 18px" }}>
      {items.slice(0, 6).map((i, k) => (
        <Text key={k} style={{ fontSize: 14, lineHeight: "20px", margin: 0, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
          {i.title}
          <span style={{ color: C.muted }}>{i.variant ? ` · ${i.variant}` : ""} × {i.qty}</span>
        </Text>
      ))}
      {items.length > 6 && <Text style={{ fontSize: 13, color: C.muted, margin: "6px 0 0" }}>+ {items.length - 6} more</Text>}
    </Section>
  ) : null;

export const Note = ({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "sale" | "success" }) => (
  <Section style={{ borderLeft: `4px solid ${tone === "sale" ? C.sale : tone === "success" ? C.success : C.gold}`, backgroundColor: tone === "sale" ? "#FFF1F3" : tone === "success" ? "#EEF8F2" : "#FFF8E1", padding: "10px 14px", borderRadius: 6, margin: "0 0 18px" }}>
    <Text style={{ fontSize: 14, lineHeight: "21px", margin: 0 }}>{children}</Text>
  </Section>
);
