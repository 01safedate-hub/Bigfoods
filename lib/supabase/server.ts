import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

type CookieAccessor = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (cookies: Array<{ name: string; value: string; options?: any }>) => void;
};

/**
 * Create a Supabase server client that uses the request/response cookie helpers
 * from @supabase/ssr. This intentionally uses the anon key so RLS + session-based
 * checks remain enforced.
 */
export function createServerSupabase(opts: {
  cookies: CookieAccessor;
  headers?: Headers | Record<string, string>;
}): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      // @supabase/ssr expects getAll/setAll shape
      getAll: opts.cookies.getAll,
      setAll: opts.cookies.setAll,
    },
    headers: opts.headers as any,
  });
}
