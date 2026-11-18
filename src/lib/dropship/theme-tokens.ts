import type { CSSProperties } from "react";
import type { ThemeKey } from "./plans";

/** Each storefront theme: colours, shape and type, applied as CSS variables (accent comes from the seller). */
export interface ThemeTokens {
  vars: Record<string, string>;
  /** Headline style: sans (bold), serif (display italic), or mono-caps. */
  headline: "sans" | "serif" | "caps";
  hero: "split" | "centered" | "editorial" | "poster";
}

const T: Record<ThemeKey, ThemeTokens> = {
  studio: { vars: { "--st-bg": "#FFFFFF", "--st-fg": "#111111", "--st-muted": "#6B6B6B", "--st-card": "#F4F4F4", "--st-line": "#EAEAEA", "--st-radius": "6px" }, headline: "sans", hero: "split" },
  noir: { vars: { "--st-bg": "#0B0B0C", "--st-fg": "#F3EDE1", "--st-muted": "#A39E93", "--st-card": "#17171A", "--st-line": "#26262B", "--st-radius": "2px" }, headline: "caps", hero: "centered" },
  bloom: { vars: { "--st-bg": "#FFF6F6", "--st-fg": "#3B1F2B", "--st-muted": "#8C6B77", "--st-card": "#FFE9EC", "--st-line": "#F6D6DC", "--st-radius": "22px" }, headline: "serif", hero: "centered" },
  atelier: { vars: { "--st-bg": "#F6F1E7", "--st-fg": "#1E1A14", "--st-muted": "#776E5F", "--st-card": "#ECE4D3", "--st-line": "#DDD3BF", "--st-radius": "0px" }, headline: "serif", hero: "editorial" },
  pulse: { vars: { "--st-bg": "#101014", "--st-fg": "#FFFFFF", "--st-muted": "#9B9BAA", "--st-card": "#1C1C24", "--st-line": "#2A2A36", "--st-radius": "14px" }, headline: "sans", hero: "poster" },
};

export const themeTokens = (t: ThemeKey) => T[t] ?? T.studio;

export function themeStyle(theme: ThemeKey, accent: string): CSSProperties {
  return { ...themeTokens(theme).vars, "--st-accent": accent, background: "var(--st-bg)", color: "var(--st-fg)" } as CSSProperties;
}

export const headlineClass = (t: ThemeKey) =>
  ({ sans: "font-black tracking-tight", serif: "font-display italic font-normal", caps: "font-semibold uppercase tracking-[0.18em]" })[themeTokens(t).headline];
