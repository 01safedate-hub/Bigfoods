import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/** Supabase client acting as the signed-in visitor (session from cookies). Row level security applies. */
export async function userDb() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
}

/** The signed-in user, verified with Supabase (not just read from the cookie). */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!hasSupabase) return null;
  const { data } = await (await userDb()).auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null, phone: data.user.phone ?? null } : null;
}

export type StaffCheck = { ok: true; user: SessionUser | null; demo: boolean } | { ok: false; reason: "signed-out" | "not-staff" };

/** Admin access: staff role required once the database is connected. Without it, admin shows demo data only. */
export async function checkStaff(): Promise<StaffCheck> {
  if (!hasSupabase) return { ok: true, user: null, demo: true };
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "signed-out" };
  const { data } = await (await userDb()).rpc("is_staff");
  return data === true ? { ok: true, user, demo: false } : { ok: false, reason: "not-staff" };
}

/** For server actions: throws unless the caller is staff (or the site runs in demo mode). */
export async function requireStaff(): Promise<SessionUser | null> {
  const s = await checkStaff();
  if (!s.ok) throw new Error("Staff only");
  return s.user;
}
