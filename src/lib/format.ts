export const naira = (n: number) => `${n < 0 ? "−" : ""}₦${Math.round(Math.abs(n)).toLocaleString("en-NG")}`;

export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n));

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
