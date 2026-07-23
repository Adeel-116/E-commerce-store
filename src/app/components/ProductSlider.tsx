"use client";
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import axios from "axios";
import "swiper/css";
import "../styles/ProductSlider.css";
import { type Product } from "../context/FilterContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { ProductSliderSkeleton } from "./Skeleton";

const FEATURED_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/universalFilter?stock=true&limit=15&status=active`;

function mapProduct(p: Product) {
  const img =
    p.image && !p.image.includes("your-domain.com")
      ? p.image
      : "/new-perfume-bottle.avif";
  return {
    id: p._id,
    slug: p.slug ?? p._id,
    image: img,
    heading: p.title,
    description: p.description ?? "",
    stock: p.stock,
    tag: (p as any).category ?? (p as any).gender ?? (p as any).tag ?? null,
    price: {
      "50ml": p.price?.["50ml"] ?? 0,
      "100ml": p.price?.["100ml"] ?? 0,
    },
    activeDiscount: p.activeDiscount ?? null,
  };
}

function applyDiscount(price: number, discount: { valueType: "percentage" | "fixed"; value: number } | null): number | null {
  if (!discount) return null;
  if (discount.valueType === "percentage") return Math.round(price * (1 - discount.value / 100));
  return Math.max(0, price - discount.value);
}

const ProductSlider = ({ title = "Featured Products" }: { title?: string }) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(FEATURED_URL);
        if (!cancelled) setProducts(data?.data ?? []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [cartAddedIds, setCartAddedIds] = useState<Set<string>>(new Set());
  const cartTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const cards = useMemo(() => products.map(mapProduct), [products]);

  /* ── wishlist toggle ─────────────────────────────────────── */
  const handleToggleWishlist = useCallback(
    (card: ReturnType<typeof mapProduct>) => {
      toggleWishlist({
        id: card.id,
        name: card.heading,
        description: card.description,
        image: card.image,
        stock: card.stock,
        price: card.price,
      });
    },
    [toggleWishlist]
  );

  const handleAddToCart = useCallback(
    (card: ReturnType<typeof mapProduct>) => {
      addToCart({
        id: card.id,
        productName: card.heading,
        brand: "",
        prices: card.price,
        size: "50ml",
        productImage: card.image,
      });
      setCartAddedIds((prev) => new Set(prev).add(card.id));
      clearTimeout(cartTimers.current[card.id]);
      cartTimers.current[card.id] = setTimeout(() => {
        setCartAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(card.id);
          return next;
        });
      }, 1500);
    },
    [addToCart]
  );

  return (
    <div className="dc-section">
      {/* ── Header ── */}
      <div className="dc-section-header">
        <h2 className="dc-section-title">{title}</h2>
      </div>

      {/* ── Slider ── */}
      <div className="draggable-cards-wrapper">
        {loading && <ProductSliderSkeleton count={4} />}

        {!loading && cards.length === 0 && (
          <div className="slider-empty">No products found.</div>
        )}

        {!loading && cards.length > 0 && (
          <Swiper
            modules={[Navigation]}
            navigation={{ prevEl: ".arrow-left", nextEl: ".arrow-right" }}
            slidesPerView={4}
            slidesPerGroup={1}
            spaceBetween={0}
            loop={cards.length > 4}
            grabCursor
            breakpoints={{
              0: { slidesPerView: 1 },
              350: { slidesPerView: 2 },
              750: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
            className="product-swiper"
          >
            {cards.map((card) => {
              const disc = card.activeDiscount;
              const discounted50 = applyDiscount(card.price["50ml"], disc);
              const badgeLabel = disc
                ? disc.valueType === "percentage"
                  ? `-${disc.value}%`
                  : `-${disc.value}`
                : null;

              return (
                <SwiperSlide key={card.id}>
                  <div className="card">

                    {badgeLabel && (
                      <span className="card-discount-tag">{badgeLabel}</span>
                    )}

                    {/* Top row: category/gender tag + wishlist */}
                    <div className="card-top-row">
                      {card.tag ? (
                        <span className={`card-tag-pill${badgeLabel ? " cg-pill-margin-left" : ""}`}>
                          {card.tag}
                        </span>
                      ) : (
                        <span />
                      )}

                      <button
                        className={`card-wishlist-btn${isWishlisted(card.id) ? " card-wishlist-btn--active" : ""}`}
                        aria-label={isWishlisted(card.id) ? "Remove from wishlist" : "Add to wishlist"}
                        onClick={() => handleToggleWishlist(card)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24"
                          fill={isWishlisted(card.id) ? "#1f1f1f" : "none"}
                          stroke={isWishlisted(card.id) ? "#1f1f1f" : "currentColor"}
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>

                    {/* Image */}
                    <div
                      className="card-image-container"
                      onClick={() => router.push(`/shop/${card.slug}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={card.image}
                        alt={card.heading}
                        draggable={false}
                        className="card-image"
                      />
                    </div>

                    {/* Bottom: title, price, add to cart */}
                    <div className="card-bottom-section">
                      <h3 className="card-heading">{card.heading}</h3>

                      <div className="card-bottom-row">
                        <div className="card-price-group">
                          {disc ? (
                            <span className="card-price-row">
                              <span className="card-price card-price--original">
                                AED <span className="card-price-value">{card.price["50ml"]}</span>
                              </span>
                              <span className="card-price card-price--discounted">
                                {discounted50}
                              </span>
                            </span>
                          ) : (
                            <span className="card-price">
                              AED {card.price["50ml"]}
                            </span>
                          )}
                        </div>

                        <button
                          className={`card-cart-btn${cartAddedIds.has(card.id) ? " card-cart-btn--added" : ""}`}
                          aria-label="Add to cart"
                          onClick={() => handleAddToCart(card)}
                        >
                          {cartAddedIds.has(card.id) ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="21" r="1" />
                              <circle cx="20" cy="21" r="1" />
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}

        <button className="arrow-button arrow-left" aria-label="Previous">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="arrow-button arrow-right" aria-label="Next">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductSlider;