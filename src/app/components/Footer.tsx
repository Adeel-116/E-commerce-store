"use client";
import React, { useState } from "react";
import axios from "axios";
import "../styles/Footer.css";
import FooterTab from "./FooterTab";
import Link from "next/link";
import { usePathname } from "next/navigation";
import api from "../lib/axios";
import { useCategories } from "../hooks/useCategories";

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/officialzaryastyle",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61592224567912",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@zaryastyle",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
  },
];

const Footer = () => {
  const pathname = usePathname();
  const isCheckoutPage = pathname?.startsWith("/checkout");
  const { categories } = useCategories();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setFeedback("");
    try {
      await api.post("/subscribe", { email: email.trim() });
      setStatus("success");
      setFeedback("You're subscribed! Watch your inbox.");
      setEmail("");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || "Something went wrong. Please try again."
        : "Something went wrong. Please try again.";
      setStatus("error");
      setFeedback(msg);
    }
  };

  return (
    <footer className="footer">
      {!isCheckoutPage && (
        <div className="main-news-letter">
          <h2>
            Sign Up & Get <span className="newsletter-highlight">10% Off</span> Your First Order
          </h2>
          <p className="newsletter-subtext">
            Join our email list for exclusive offers and the latest news.
          </p>

          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <div className="newsletter-field">
              <input
                type="email"
                placeholder="Your Email Address"
                className="newsletter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="newsletter-button" disabled={status === "loading"}>
                {status === "loading" ? "SUBSCRIBING…" : "SUBSCRIBE"}
              </button>
            </div>
          </form>
          {feedback && (
            <p className={`newsletter-feedback${status === "error" ? " newsletter-feedback-error" : ""}`}>
              {feedback}
            </p>
          )}
        </div>
      )}
      <FooterTab />

      {/* Main Footer Content */}

      <section className="footer-content">
        <div className="footer-container">
          {/* Company Info */}
          <div className="footer-column">
            <Link href={"/"} className="footer-logo">
              <img src="/white-version.avif" alt="Zarya Style" title="Zarya Style" className="footer-brand-logo" />
            </Link>

            <p className="footer-description">
              Zarya Style is your destination for premium everyday and
              occasion wear, bringing you a curated clothing shopping
              experience from start to finish.
            </p>
            <div className="footer-contact">
              <span className="footer-contact-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </span>
              <a href="mailto:infozaryastyle@gmail.com">infozaryastyle@gmail.com</a>
            </div>
            <div className="footer-contact">
              <span className="footer-contact-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <a href="https://wa.me/923483935003" target="_blank" rel="noopener noreferrer">
                +92 348 3935003
              </a>
            </div>

            <div className="footer-socials">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="footer-social-icon"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop By */}
          <div className="footer-column">
            <h4 className="footer-heading">Shop by</h4>
            <ul className="footer-links">
              {categories.map((category) => (
                <li key={category._id ?? category.slug}>
                  <Link href={`/shop?category=${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div className="footer-column">
            <h4 className="footer-heading">Information</h4>
            <ul className="footer-links">
              <li>
                <Link href="/contact-us">Contact Us</Link>
              </li>
              <li>
                <a className="footer-whatsapp-button" href="https://wa.me/923483935003" target="_blank" rel="noopener noreferrer" aria-label="Chat with Zarya Style on WhatsApp">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm0 18.12h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.34c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.2-8.24 8.2zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.13.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" /></svg>
                  WhatsApp
                </a>
              </li>
              <li>
                <Link href="/about-us">About Us</Link>
              </li>
              <li>
                <Link href="/shop">Shop</Link>
              </li>
              <li>
                <Link href="/terms-and-conditions">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="/privacy-policy">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Our Promise */}
          <div className="footer-column">
            <h4 className="footer-heading">Our Promise</h4>
            <div className="footer-promise-box">
              <svg
                className="footer-promise-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <p>Quality clothing, delivered with care.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Copyright */}
      <section className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            Copyright © 2026 <strong>Zarya Style</strong>. All Rights
            Reserved
          </p>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
