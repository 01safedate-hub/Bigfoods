"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client for sign-in only. Values are public (publishable key); data access is guarded by RLS. */
export const browserDb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "");
export const authAvailable = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
