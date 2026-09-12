"use client";

import "../styles/Banner.css";

function StaticBanner({ id, src, alt }) {
  return (
    <section className="promo-banner" id={id}>
      <img src={src} alt={alt} title={alt} />
    </section>
  );
}

const Banner = () => (
  <StaticBanner id="offer" src="/banner2.avif" alt="Store seasonal promotion" />
);
export const SummerBanner = () => (
  <StaticBanner
    id="summer-collection"
    src="/summer-banner.avif"
    alt="Summer Collection"
  />
);
export default Banner;
