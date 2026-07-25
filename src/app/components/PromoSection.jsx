import Link from "next/link";
import "../styles/PromoSection.css";

const PromoSection = () => {
  return (
    <>
      <section className="promo">
        <div className="promo-tile promo-light">
          <div className="promo-copy">
            <svg className="ribbon-graphic" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="35" r="24" fill="#b0b0b0" opacity="0.35" />
              <path
                d="M50 55v35M35 90l15-10 15 10"
                stroke="#1f1f1f"
                strokeWidth="3"
                fill="none"
              />
            </svg>

            {/* <span className="eyebrow">Build a Set</span> */}
            <h3>Two bottles are always better together.</h3>
            <p>
              Pick one for you and one to give or two just for you. Either
              way, it's 50 PKR at checkout.
            </p>
            <Link href="/shop" className="btn">
              Build Your Bundle
            </Link>
          </div>
        </div>

        <div className="promo-tile promo-dark">
          <img
            src="/bundle-banner.avif"
            alt="Monk Perfume gift sets"
            className="promo-image"
          />

          {/* <div className="promo-copy">
            <span className="eyebrow">Gifting</span>
            <h3>Perfect for gifting, priced to give twice.</h3>
            <p>
              Every Monk bottle arrives gift-ready — the bundle price just makes
              it easier to give more.
            </p>
            <a href="#shop" className="btn btn-light">
              Shop Gift Sets
            </a>
          </div> */}
        </div>
      </section>
    </>
  );
};

export default PromoSection;
