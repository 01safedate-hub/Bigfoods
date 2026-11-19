/** The 1200×630 share card used by every Open Graph image (rendered by next/og, so inline styles only). */
export function OgCard({ kicker, title, foot = "fastchina.shop", dark = false }: { kicker: string; title: string; foot?: string; dark?: boolean }) {
  const fg = dark ? "#FBFAF6" : "#111111";
  const accent = dark ? "#D9B866" : "#0b6b3a";
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: dark ? "#0D0D0B" : "#FFFFFF", color: fg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: fg, color: dark ? "#0D0D0B" : "#F5C542", display: "flex", alignItems: "center", justifyContent: "center", }}>
          <svg width="34" height="34" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill={dark ? "#0D0D0B" : "#F5C542"} /></svg>
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>FastChina</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, color: accent }}>{kicker.toUpperCase()}</div>
        <div style={{ fontSize: title.length > 60 ? 58 : 70, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>{title}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: dark ? "#C9C3B3" : "#555555" }}>
        <span>{foot}</span>
        <span>Free shipping · Pay in Naira · Jumia pickup stations</span>
      </div>
    </div>
  );
}
