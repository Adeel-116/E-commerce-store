"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import "../styles/SubscribePopup.css";
import api from "../lib/axios";

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const POPUP_SESSION_KEY = "subscribe_popup_shown";
const POPUP_DELAY_MS = 15000;
const INSTAGRAM_URL = "https://instagram.com/zaryastyle";

export default function SubscribePopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(POPUP_SESSION_KEY)) return;

    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem(POPUP_SESSION_KEY, "1");
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  const handleClose = () => setShow(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setFeedback("");
    try {
      await api.post("/subscribe", { email: email.trim() });
      setStatus("success");
      setFeedback("You're in! Follow us on Instagram to see the weekly reward.");
      setEmail("");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || "Something went wrong. Please try again."
        : "Something went wrong. Please try again.";
      setStatus("error");
      setFeedback(msg);
    }
  };

  if (!show) return null;

  return (
    <div className="subscribe-popup-overlay" onClick={handleClose}>
      <div
        className="subscribe-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="subscribe-popup__close"
          aria-label="Close"
          onClick={handleClose}
        >
          <X size={18} />
        </button>

        <span className="subscribe-popup__eyebrow">Weekly Reward</span>
        <h2 id="subscribe-popup-title" className="subscribe-popup__title">
          Subscribe &amp; Win Every Week
        </h2>
        <p className="subscribe-popup__text">
          Join our list and follow us on Instagram, where this week&apos;s
          reward winner is announced.
        </p>

        {status === "success" ? (
          <div className="subscribe-popup__success">
            <p>{feedback}</p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="subscribe-popup__instagram"
            >
              <InstagramIcon size={16} />
              Follow on Instagram
            </a>
          </div>
        ) : (
          <>
            <form className="subscribe-popup__form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Your Email Address"
                className="subscribe-popup__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="subscribe-popup__button"
                disabled={status === "loading"}
              >
                {status === "loading" ? "SUBSCRIBING…" : "SUBSCRIBE NOW"}
              </button>
            </form>
            {feedback && (
              <p className="subscribe-popup__feedback subscribe-popup__feedback-error">
                {feedback}
              </p>
            )}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="subscribe-popup__instagram-link"
            >
              <InstagramIcon size={15} />
              @zaryastyle
            </a>
          </>
        )}
      </div>
    </div>
  );
}
