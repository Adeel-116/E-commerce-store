"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";
import "../styles/OfferMarquee.css";

const DEFAULT_TEXT = "Free Shipping & a Free Gift on Orders Above Rs 10,000";

export default function OfferMarquee() {
  const [text, setText] = useState(DEFAULT_TEXT);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/storefront-settings", { signal: controller.signal })
      .then(({ data }) => {
        const nextText = data?.data?.marqueeText;
        if (typeof nextText === "string" && nextText.trim()) setText(nextText.trim());
      })
      .catch((error) => {
        if (error?.code !== "ERR_CANCELED") console.error("Failed to load storefront settings", error);
      });
    return () => controller.abort();
  }, []);

  const track = Array.from({ length: 4 }, () => text);

  return (
    <div className="offer-marquee" role="marquee">
      <div className="offer-marquee__track">
        {track.map((offer, index) => (
          <span className="offer-marquee__item" key={index}>
            {offer}
          </span>
        ))}
      </div>
    </div>
  );
}
