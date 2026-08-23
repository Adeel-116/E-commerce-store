"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import "../styles/RecentSalePopup.css";
import api from "../lib/axios";

type SaleProduct = {
  _id: string;
  title: string;
  slug: string;
  images: string[];
};

// Illustrative "recent activity" widget — not tied to real orders. Names and
// timing are simulated, same spirit as the sold-count/viewer-count badges on
// the product detail page; products shown are real, pulled from the catalog.
const BUYER_NAMES = [
  "Iqra", "Ayesha", "Sana", "Hina", "Mahnoor", "Zainab", "Fatima", "Amina",
  "Rabia", "Sara", "Maria", "Komal", "Areeba", "Noor", "Farah",
];

const MINUTES_AGO_POOL = [2, 3, 5, 7, 9, 11, 14, 18, 22, 26];

const FIRST_DELAY_MIN_MS = 10000;
const FIRST_DELAY_MAX_MS = 20000;
const VISIBLE_MS = 6000;
const GAP_MS = 90000;

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export default function RecentSalePopup() {
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [current, setCurrent] = useState<{
    name: string;
    minutesAgo: number;
    product: SaleProduct;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/universalFilter", {
          params: { status: "active", stock: "true", limit: 20 },
        });
        if (!cancelled) setProducts(data?.data ?? []);
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (dismissed || products.length === 0) return;

    let hideTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const showOne = () => {
      const product = pickRandom(products);
      const name = pickRandom(BUYER_NAMES);
      const minutesAgo = pickRandom(MINUTES_AGO_POOL);
      if (!product || !name || minutesAgo === undefined) return;

      setCurrent({ name, minutesAgo, product });
      setVisible(true);

      hideTimer = setTimeout(() => {
        setVisible(false);
        nextTimer = setTimeout(showOne, GAP_MS);
      }, VISIBLE_MS);
    };

    const firstTimer = setTimeout(showOne, randomBetween(FIRST_DELAY_MIN_MS, FIRST_DELAY_MAX_MS));

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, dismissed]);

  if (dismissed || !current) return null;

  const image = current.product.images?.[0];

  return (
    <div
      className={`recent-sale-toast${visible ? " recent-sale-toast--visible" : ""}`}
      role="status"
    >
      <Link
        href={`/shop/${current.product.slug}`}
        className="recent-sale-toast__link"
        onClick={() => setVisible(false)}
      >
        {image && (
          <img src={image} alt={current.product.title} className="recent-sale-toast__img" />
        )}
        <div className="recent-sale-toast__body">
          <p className="recent-sale-toast__text">
            <strong>{current.name}</strong> just bought this
          </p>
          <p className="recent-sale-toast__product">{current.product.title}</p>
          <p className="recent-sale-toast__time">{current.minutesAgo} minutes ago</p>
        </div>
      </Link>
      <button
        type="button"
        className="recent-sale-toast__close"
        aria-label="Dismiss"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDismissed(true);
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
