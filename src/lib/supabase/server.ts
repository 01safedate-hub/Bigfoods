import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

const options = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/** Public (customer-level) access: row level security and column grants apply. */
export const publicDb = () => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);

/**
 * Server-only access for things customers must never see directly (costs for the checkout quote).
 * Requires SUPABASE_SECRET_KEY, which must never be exposed to the browser.
 */
export function secretDb() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set on the server");
  return createClient(SUPABASE_URL, key, options);
}
