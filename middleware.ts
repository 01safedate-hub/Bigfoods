import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from './lib/supabase/server';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_BASE = '/admin';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page through
  if (pathname === ADMIN_LOGIN_PATH) return NextResponse.next();

  // Only protect /admin routes
  if (!pathname.startsWith(ADMIN_BASE)) return NextResponse.next();

  // Create a response we can mutate (so cookie set/delete operations are preserved)
  let response = NextResponse.next();

  // Build the cookie accessors expected by @supabase/ssr (getAll / setAll)
  const cookieAccessors = {
    getAll: () => {
      // NextRequest.cookies.getAll() returns an array of cookies with shape { name, value, ... }
      return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
    },
    setAll: (cookiesToSet: Array<{ name: string; value: string; options?: any }>) => {
      // Ensure we set cookies on the response that will be returned to the client
      // (NextResponse.cookies.set supports (name, value, options))
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
    },
  };

  // Create server supabase client using the shared helper
  const supabase = createServerSupabase({
    cookies: cookieAccessors,
    headers: req.headers as any,
  });

  try {
    // Call the RPC that returns whether the current authenticated user is an admin
    const { data, error } = await supabase.rpc('is_admin');

    const isAdmin = !!(data as any);

    if (!isAdmin || error) {
      // Redirect non-admins to login
      const redirectUrl = new URL(ADMIN_LOGIN_PATH, req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // User is admin; return the (possibly mutated) response so any refresh cookies are included
    return response;
  } catch (err) {
    // On unexpected errors, redirect to login as a safe default
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url));
  }
}

export const config = {
  // Match all /admin routes; login is allowed through above logic
  matcher: ['/admin/:path*'],
};
