"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import api from "../lib/axios";

const uuid = () => crypto.randomUUID();

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const host = window.location.hostname;
    if (process.env.NODE_ENV !== "production" || host === "localhost" || host === "127.0.0.1" || pathname.startsWith("/admin")) return;

    let visitorId = localStorage.getItem("zarya_visitor_id");
    if (!visitorId) { visitorId = uuid(); localStorage.setItem("zarya_visitor_id", visitorId); }
    const sessionKey = "zarya_analytics_session";
    const stored = sessionStorage.getItem(sessionKey);
    const sessionId = stored || uuid();
    if (!stored) sessionStorage.setItem(sessionKey, sessionId);

    const ua = navigator.userAgent;
    const searchParams = new URLSearchParams(window.location.search);
    const device = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobile|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
    const referrer = sessionStorage.getItem("zarya_initial_referrer") || document.referrer || "Direct";
    if (!sessionStorage.getItem("zarya_initial_referrer")) sessionStorage.setItem("zarya_initial_referrer", referrer);

    const timer = window.setTimeout(() => {
      api.post("/analytics/track", {
        sessionId, visitorId, path: pathname, title: document.title, referrer, device,
        source: searchParams.get("utm_source") || "",
        campaign: searchParams.get("utm_campaign") || "",
      }).catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
