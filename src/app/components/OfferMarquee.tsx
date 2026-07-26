"use client";

import { usePathname } from "next/navigation";
import "../styles/OfferMarquee.css";

const OFFERS = [
  "Spend Rs. 4,000+ & Get FREE Shipping",
  "Spend Rs. 2,500+ & Get a FREE Gift",
  "New Arrivals Dropping Every Week",
];

export default function OfferMarquee() {
  const pathname = usePathname();
  const isCheckoutPage = pathname?.startsWith("/checkout");
  if (isCheckoutPage) return null;

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
