"use client";

import "../styles/OfferMarquee.css";

const OFFERS: { text: string; code?: string }[] = [
  { text: "Free Shipping & a Free Gift on Orders Above Rs 10,000" },
];

export default function OfferMarquee() {
  const track = [...OFFERS, ...OFFERS, ...OFFERS, ...OFFERS];

  return (
    <div className="offer-marquee" role="marquee">
      <div className="offer-marquee__track">
        {track.map((offer, index) => (
          <span className="offer-marquee__item" key={index}>
            {offer.text}
            {offer.code && <span className="offer-marquee__code">{offer.code}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
