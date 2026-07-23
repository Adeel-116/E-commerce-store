"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "../context/CartContext";
import api from "../lib/axios";
import { ttqPurchase } from "../lib/tiktokEvents";

type Status = "loading" | "success" | "error";

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { cartItems, pricing, clearCart } = useCart();
  const verified = useRef(false);
  const cartSnapshotRef = useRef({ cartItems, pricing });

  const [status, setStatus] = useState<Status>("loading");
  const [orderId, setOrderId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Keep the latest cart snapshot available for the verify-session callback below,
  // since cart items must be read before clearCart() empties them
  useEffect(() => {
    cartSnapshotRef.current = { cartItems, pricing };
  }, [cartItems, pricing]);

  useEffect(() => {
    if (!sessionId || verified.current) return;
    verified.current = true;

    api
      .post(`/checkout/verify-session/${sessionId}`)
      .then((res) => {
        setOrderId(res.data.orderId ?? "");
        const { cartItems: items, pricing: p } = cartSnapshotRef.current;
        ttqPurchase({
          contents: items.map((item) => ({
            content_id: item.id,
            content_type: "product",
            content_name: item.productName,
            price: item.unitPrice,
            num_items: item.quantity,
          })),
          value: p?.total ?? items.reduce((s, i) => s + i.lineSubtotal, 0),
        });
        clearCart();
        setStatus("success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.error ??
          "We could not confirm your order. Please contact support.";
        setErrorMsg(msg);
        setStatus("error");
      });
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div style={styles.center}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <p style={styles.loadingText}>Confirming your order…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={styles.center}>
        <div style={{ ...styles.iconWrap, background: "var(--bg-soft-2)" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.sub}>{errorMsg}</p>
        <a href="/checkout" style={styles.btn}>Back to Checkout</a>
      </div>
    );
  }

  return (
    <div style={styles.center}>
      <div style={{ ...styles.iconWrap, background: "var(--bg-soft)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 style={styles.title}>Order Confirmed!</h1>
      <p style={styles.sub}>
        Thank you for your purchase. We&apos;re preparing your order right now.
      </p>
      {orderId && (
        <p style={styles.orderId}>
          Order ID: <strong>{orderId}</strong>
        </p>
      )}
      <a href="/shop" style={styles.btn}>Continue Shopping</a>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    padding: "48px 24px",
    textAlign: "center",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "var(--brandgreen)",
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: "var(--muted)",
    maxWidth: 400,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  orderId: {
    fontSize: 13,
    color: "var(--gold-soft)",
    marginBottom: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "var(--muted)",
  },
  btn: {
    marginTop: 32,
    display: "inline-block",
    background: "var(--brandgreen)",
    color: "var(--brandcream)",
    padding: "12px 32px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
  },
};
