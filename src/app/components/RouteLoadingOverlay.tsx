"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingRing from "./LoadingRing";
import "../styles/RouteLoadingOverlay.css";

// Nothing loads instantly even once the route has mounted (images, fonts,
// etc.) — hold the overlay for at least this long after showing it so it
// never just flashes, but the real dismiss trigger is the pathname match
// below, not this timer.
const MIN_VISIBLE_MS = 500;
// Ceiling in case navigation never actually resolves (e.g. an external
// redirect within the same origin) — the overlay shouldn't hang forever.
const MAX_VISIBLE_MS = 8000;

export default function RouteLoadingOverlay() {
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);
  const targetKey = useRef<string | null>(null);
  const shownAt = useRef(0);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setVisible(false);
    targetKey.current = null;
    if (maxTimer.current) {
      clearTimeout(maxTimer.current);
      maxTimer.current = null;
    }
  }, []);

  const showUntilNavigates = useCallback((nextKey: string) => {
    if (maxTimer.current) clearTimeout(maxTimer.current);

    targetKey.current = nextKey;
    shownAt.current = performance.now();
    setVisible(true);

    // Safety net: if the target route never actually shows up (broken link,
    // navigation cancelled, etc.), don't leave the overlay stuck forever.
    maxTimer.current = setTimeout(hide, MAX_VISIBLE_MS);
  }, [hide]);

  useEffect(() => {
    const pendingPath = sessionStorage.getItem("zarya:full-navigation");
    if (!pendingPath) return;
    sessionStorage.removeItem("zarya:full-navigation");
    showUntilNavigates(pendingPath);
  }, [showUntilNavigates]);

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      // Note: don't bail on event.defaultPrevented here — Next.js's <Link>
      // always calls preventDefault() on the native click before performing
      // its own client-side transition, so that flag is set on every normal
      // Link click and would otherwise make this handler a no-op.
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      // Only product cards (Best Sellers on the homepage + the Shop page
      // grid both render the same ProductCard, marked with .cg-card)
      // should trigger this — not every link on the site.
      const link = (event.target as HTMLElement)?.closest(
        "a.cg-card, .navbar2 a, .navbar2-drawer a, .csb-btn-row a",
      ) as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target && link.target !== "_self") return;
      const isHeaderLink = !!link.closest(".navbar2, .navbar2-drawer");
      const isCartAction = !!link.closest(".csb-btn-row");
      const requiresFullReload = isHeaderLink || isCartAction;

      // The card's own controls (image arrows, wishlist, quick-add, color
      // swatches) call stopPropagation() to swallow the click before it
      // becomes a navigation — but that only stops React's synthetic
      // bubbling, not this native document-level listener. Skip those so
      // the overlay doesn't flash for clicks that never actually navigate.
      const control = (event.target as HTMLElement)?.closest(
        ".cg-card-arrow, .cg-card-wishlist-float, .cg-card-quick-add, .cg-card-color-dot, .cg-card-color-swatches",
      );
      if (control) return;

      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      if (!requiresFullReload && url.pathname === pathname) return;

      showUntilNavigates(url.pathname);

      if (requiresFullReload) {
        event.preventDefault();
        sessionStorage.setItem("zarya:full-navigation", url.pathname);
        window.setTimeout(() => window.location.assign(url.href), 60);
      }
    };

    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [pathname, showUntilNavigates]);

  // The real dismiss signal: the app has actually rendered the route we were
  // waiting for. Enforce MIN_VISIBLE_MS so it never just flashes on fast
  // navigations, but otherwise this fires as soon as content is ready —
  // never on a blind fixed timer.
  useEffect(() => {
    if (!targetKey.current || pathname !== targetKey.current) return;

    const elapsed = performance.now() - shownAt.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timer = setTimeout(hide, remaining);
    return () => clearTimeout(timer);
  }, [pathname, hide]);

  useEffect(() => {
    return () => {
      if (maxTimer.current) clearTimeout(maxTimer.current);
    };
  }, []);

  return (
    <div
      className={`route-loading-overlay${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
      role="status"
      aria-live="polite"
    >
      <div className="rlo-stack">
        <p className="rlo-eyebrow">Zarya Style</p>
        <LoadingRing active={visible} />
        <p className="rlo-text">Loading…</p>
      </div>
    </div>
  );
}
