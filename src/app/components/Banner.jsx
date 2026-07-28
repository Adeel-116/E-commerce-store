"use client";

import "../styles/Banner.css";

const Banner = () => {
  return (
    <>
      <section className="promo-banner" id="offer">
        <img src="/banner2.avif" alt="Store seasonal promotion" title="Store seasonal promotion" />
      </section>
    </>
  );
};

export const SummerBanner = () => {
  return (
    <section className="promo-banner" id="summer-collection">
      <img
        src="/summer-banner.avif"
        alt="Summer Collection"
        title="Summer Collection"
      />
    </section>
  );
};

export default Banner;
