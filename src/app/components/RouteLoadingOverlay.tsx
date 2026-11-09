"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingRing from "./LoadingRing";
import "../styles/RouteLoadingOverlay.css";

export default function RouteLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [target, setTarget] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const routeKey = pathname + (searchParams.toString() ? `?${searchParams}` : "");

  useEffect(() => {
    const start = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof MouseEvent && event.button !== 0) return;
      if (event instanceof KeyboardEvent && event.key !== "Enter") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("button, input, select, textarea, .cg-card-color-swatches")) return;
      const link = event.target.closest("a[href], [data-navigation-href]");
      if (!link || link.hasAttribute("download")) return;
      if (link.getAttribute("target") && link.getAttribute("target") !== "_self") return;
      const href = link.getAttribute("href") || link.getAttribute("data-navigation-href");
      if (!href) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/admin")) return;
      if (url.pathname + url.search === routeKey) return;
      setSlow(false);
      setTarget(url.pathname + url.search);
    };
    // Capture before React handlers stop propagation (cart close and card controls).
    document.addEventListener("click", start, true);
    document.addEventListener("keydown", start, true);
    const clear = () => setTarget(null);
    window.addEventListener("popstate", clear);
    return () => {
      document.removeEventListener("click", start, true);
      document.removeEventListener("keydown", start, true);
      window.removeEventListener("popstate", clear);
    };
  }, [routeKey]);

  useEffect(() => {
    const timer = setTimeout(() => { setTarget(null); setSlow(false); }, 0);
    return () => clearTimeout(timer);
  }, [routeKey]);

  useEffect(() => {
    if (!target) return;
    const timer = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(timer);
  }, [target]);

  return <div className={`route-loading-overlay${target ? " is-visible" : ""}`} aria-hidden={!target} role="status" aria-live="polite">
    <div className="rlo-stack">
      <p className="rlo-eyebrow">Zarya Style</p>
      <LoadingRing active={!!target} />
      <p className="rlo-text">{slow ? "Your connection is taking longer than usual." : "Loading..."}</p>
      {slow && <><a href={target || pathname}>Open page directly</a><button type="button" onClick={() => setTarget(null)}>Keep browsing</button></>}
    </div>
  </div>;
}
