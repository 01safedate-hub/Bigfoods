import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { hasSupabase } from "@/lib/supabase/env";
import { secretDb } from "@/lib/supabase/server";

/** The visitor's IP, hashed (we only need to count requests, not know who sent them). */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(`fc:${ip}`).digest("base64url").slice(0, 22);
}

/**
 * True if the action may run. Counts in the database so limits hold across servers.
 * Fails open (allows) if the database can't answer, so a hiccup never blocks real customers.
 */
export async function allow(action: string, max: number, windowSeconds: number, who?: string): Promise<boolean> {
  if (!hasSupabase) return true;
  const key = `${action}:${who ?? (await clientKey())}`;
  const { data, error } = await secretDb().rpc("hit_rate_limit", { p_key: key, p_limit: max, p_window_seconds: windowSeconds });
  return error ? true : data !== false;
}

export const TOO_MANY = "Too many tries. Please wait a few minutes and try again.";
