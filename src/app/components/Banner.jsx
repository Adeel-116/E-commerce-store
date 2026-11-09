"use client";

import Link from "next/link";
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
export const WinterBanner = () => (
  <section className="winter-banner" id="winter-collection" aria-label="Winter collection - up to 20% off">
    <Link href="/shop" aria-label="Shop the winter collection - up to 20% off">
      <picture>
        <source media="(max-width: 767px)" srcSet="/winter-collection-mobile.avif" type="image/avif" width="960" height="1200" />
        <img
          src="/winter-collection-desktop.avif"
          alt="Zarya Style Winter Collection - up to 20% off. Matching sets in maroon, olive, navy and sky blue, blue floral maxi and floral stripe suit."
          width="1983"
          height="793"
          loading="lazy"
          decoding="async"
        />
      </picture>
    </Link>
  </section>
);
export default Banner;
