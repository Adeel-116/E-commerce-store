"use client";

import "../styles/OfferMarquee.css";
import { FREE_SHIPPING_THRESHOLD } from "../lib/shipping";

const OFFERS = [
  `Spend Rs. ${FREE_SHIPPING_THRESHOLD.toLocaleString("en-PK")}+ & Get FREE Shipping`,
  "Spend Rs. 2,500+ & Get a FREE Gift",
  "New Arrivals Dropping Every Week",
];

export default function OfferMarquee() {
  const track = [...OFFERS, ...OFFERS, ...OFFERS, ...OFFERS];

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
