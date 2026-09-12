"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import api from "../lib/axios";
import "../styles/PremiumFooter.css";

const socials = [["Instagram", "https://www.instagram.com/officialzaryastyle"], ["Facebook", "https://www.facebook.com/profile.php?id=61592224567912"], ["TikTok", "https://www.tiktok.com/@zaryastyle"]];

export default function PremiumFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const subscribe = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || status === "loading") return;
    setStatus("loading");
    try {
      await api.post("/subscribe", { email: email.trim() });
      setEmail(""); setStatus("success");
    } catch { setStatus("error"); }
  };

  return <footer className="premium-footer">
    <div className="pf-newsletter-lead">
      <div><span>Welcome to Zarya Style</span><h2>Sign up &amp; get 10% off your first order</h2><p>New arrivals, private offers and style updates—sent thoughtfully.</p></div>
      <form onSubmit={subscribe}><div className="pf-email-field"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" aria-label="Email address" required /><button disabled={status === "loading"}>{status === "loading" ? "Joining…" : "Join now"}</button></div>{status === "success" && <small>Welcome to Zarya Style. Check your inbox soon.</small>}{status === "error" && <small className="is-error">Already subscribed or something went wrong.</small>}</form>
    </div>
    <div className="pf-rule" />
    <div className="pf-grid">
      <div className="pf-intro"><Link className="pf-logo" href="/">Zarya <em>Style</em></Link><p>Premium everyday and occasion wear, thoughtfully curated for a modern wardrobe.</p><Link className="pf-contact-button" href="/contact-us">Contact us <span>↗</span></Link></div>
      <nav className="pf-column" aria-label="Shop"><h3>Shop</h3><Link href="/shop">Shop all</Link><Link href="/shop?category=maxi">Maxi</Link><Link href="/shop?category=fashion">Fashion</Link><Link href="/shop?category=top-jeans">Top &amp; Jeans</Link><Link href="/shop?category=western">Western</Link></nav>
      <nav className="pf-column" aria-label="Customer care"><h3>Customer care</h3><Link href="/about-us">About us</Link><Link href="/contact-us">Contact us</Link><Link href="/shipping-policy">Shipping policy</Link><Link href="/returns-and-exchanges">Returns &amp; exchanges</Link><Link href="/terms-and-conditions">Terms &amp; conditions</Link><Link href="/privacy-policy">Privacy policy</Link></nav>
      <div className="pf-column"><h3>Connect</h3><a href="mailto:infozaryastyle@gmail.com">infozaryastyle@gmail.com</a><a href="https://wa.me/923483935003" target="_blank" rel="noopener noreferrer">+92 348 3935003</a><div className="pf-socials">{socials.map(([label,url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label}</a>)}</div></div>
    </div>
    <div className="pf-wordmark" aria-hidden="true">
      <svg viewBox="0 0 1600 230" role="presentation" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id="pf-video-wordmark">
            <text x="800" y="188" textAnchor="middle" textLength="1480" lengthAdjust="spacingAndGlyphs">ZARYA STYLE</text>
          </clipPath>
        </defs>
        <foreignObject width="1600" height="230" clipPath="url(#pf-video-wordmark)">
          <video className="pf-wordmark-video" autoPlay muted loop playsInline preload="metadata" onLoadedMetadata={(event) => { event.currentTarget.playbackRate = 0.6; }}>
            <source src="/Footer-video.mp4" type="video/mp4" />
          </video>
        </foreignObject>
      </svg>
    </div>
    <div className="pf-bottom"><p>© 2026 Zarya Style. All rights reserved.</p><button onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>Back to top ↑</button></div>
  </footer>;
}
