"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "../styles/RouteLoadingOverlay.css";

const VISIBLE_MS = 3000;

export default function RouteLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showForVisibleDuration = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      hideTimer.current = null;
    }, VISIBLE_MS);
  }, []);

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
      const card = (event.target as HTMLElement)?.closest("a.cg-card") as HTMLAnchorElement | null;
      if (!card) return;
      if (card.target && card.target !== "_self") return;

      let url: URL;
      try {
        url = new URL(card.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const nextKey = `${url.pathname}${url.search}`;
      const sameKey = nextKey === `${window.location.pathname}${window.location.search}`;
      if (sameKey) return;

      showForVisibleDuration();
    };

    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [showForVisibleDuration]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
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
        <div className="rlo-main">
          <div className="rlo-up">
            <div className="rlo-loaders">
              {Array.from({ length: 9 }).map((_, i) => (
                <div className="rlo-loader" key={i} />
              ))}
            </div>
            <div className="rlo-loadersB">
              {Array.from({ length: 9 }).map((_, i) => (
                <div className="rlo-loaderA" key={i}>
                  <div className={`rlo-ball rlo-ball${i}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="rlo-text">Loading…</p>
      </div>
    </div>
  );
}
