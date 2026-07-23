"use client";
import React, { useState } from "react";
import axios from "axios";
import "../styles/Footer.css";
import FooterTab from "./FooterTab";
import Link from "next/link";
import { usePathname } from "next/navigation";
import api from "../lib/axios";
import ShippingInfo from "./ShippingInfo";

const Footer = () => {
  const pathname = usePathname();
  const isCheckoutPage = pathname?.startsWith("/checkout");

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
      {/* <FooterTab /> */}

      {/* Main Footer Content */}


        <ShippingInfo/>

      <section className="footer-content">
        <div className="footer-container">
          {/* Company Info */}
          <div className="footer-column">
            <Link href={"/"} className="footer-logo">
              <img src="/azan-ac-icon-v2-light.png" alt="" className="footer-logo-icon" />
              <span className="footer-logo-words">
                <span className="footer-logo-main">AZAN</span>
                <span className="footer-logo-sub">Collection</span>
              </span>
            </Link>

            <p className="footer-description">
              Azan Collection is your destination for premium everyday and
              occasion wear, bringing you a curated clothing shopping
              experience from start to finish.
            </p>
            <div className="footer-contact">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
              <a href="mailto:support@azancollection.com">support@azancollection.com</a>
            </div>
          </div>

          {/* Shop By */}
          <div className="footer-column">
            <h4 className="footer-heading">Shop by</h4>
            <ul className="footer-links">
              <li>
                <Link href="/shop?category=maxi">Maxi</Link>
              </li>
              <li>
                <Link href="/shop?category=fashion">Fashion</Link>
              </li>
              <li>
                <Link href="/shop?category=top-jeans">Top & Jeans</Link>
              </li>
              <li>
                <Link href="/shop?category=western">Western</Link>
              </li>
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

          {/* Rewards */}
          <div className="footer-column">
            {/* <h4 className="footer-heading">Rewards</h4> */}
            {/* <ul className="footer-links">
              <li>
                <a href="#">Affiliate Program</a>
              </li>
              <li>
                <a href="#">Giveaways</a>
              </li>
              <li>
                <a href="#">Wholesale</a>
              </li>
            </ul> */}
            <div className="footer-column-last-container">

            
            <div className="footer-badges">
              <div className="stripe-badge" aria-label="Secured by Stripe">
                stripe
              </div>
            </div>


            <div className="footer-bottom-text">
              <p>Quality clothing, delivered with care.</p>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Copyright & Payments */}
      <section className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            Copyright © 2026 <strong>Azan Collection</strong>. All Rights
            Reserved
          </p>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
