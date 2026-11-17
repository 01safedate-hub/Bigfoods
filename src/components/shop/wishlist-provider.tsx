"use client";

import { createContext, use, useEffect, useRef } from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { myWishlist, syncWishlist } from "@/app/(shop)/actions";

interface Wishlist {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
}
const Ctx = createContext<Wishlist | null>(null);

/**
 * Saved items. Kept in the browser, and synced to the customer's account when signed in,
 * so they follow them to other devices. Items saved before signing in are merged in.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = usePersistentState<string[]>("fc-wishlist", []);
  const signedIn = useRef(false);
  const local = useRef(slugs);
  useEffect(() => {
    local.current = slugs;
  }, [slugs]);

  useEffect(() => {
    let live = true;
    myWishlist().then(async (server) => {
      if (!live || server === null) return;
      signedIn.current = true;
      const missing = local.current.filter((s) => !server.includes(s));
      if (missing.length) await syncWishlist(missing, []);
      setSlugs([...new Set([...server, ...local.current])]);
    }).catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (slug: string) => {
    const on = slugs.includes(slug);
    setSlugs(on ? slugs.filter((s) => s !== slug) : [slug, ...slugs]);
    if (signedIn.current) void syncWishlist(on ? [] : [slug], on ? [slug] : []).catch(() => {});
  };
  return <Ctx value={{ slugs, has: (s) => slugs.includes(s), toggle }}>{children}</Ctx>;
}

export function useWishlist(): Wishlist {
  const v = use(Ctx);
  if (!v) throw new Error("useWishlist must be used inside the shop layout");
  return v;
}
