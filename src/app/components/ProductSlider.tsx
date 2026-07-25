"use client";
import { useState, useMemo, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import axios from "axios";
import "swiper/css";
import "../styles/ProductSlider.css";
import { type Product } from "../context/FilterContext";
import { ProductSliderSkeleton } from "./Skeleton";
import { ProductCard, type GridProduct } from "./ProductGrid";

const FEATURED_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/universalFilter?stock=true&limit=15&status=active`;

const ProductSlider = ({ title = "Featured Products" }: { title?: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const sliderId = useMemo(() => Math.random().toString(36).substring(7), []);

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

  return (
    <div className="dc-section">
      {/* ── Header ── */}
      <div className="dc-section-header">
        <h2 className="dc-section-title">{title}</h2>
      </div>

      {/* ── Slider ── */}
      <div className="draggable-cards-wrapper">
        {loading && <ProductSliderSkeleton count={4} />}

        {!loading && products.length === 0 && (
          <div className="slider-empty">No products found.</div>
        )}

        {!loading && products.length > 0 && (
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: `.arrow-left-${sliderId}`,
              nextEl: `.arrow-right-${sliderId}`,
            }}
            slidesPerView={4}
            slidesPerGroup={1}
            spaceBetween={0}
            loop={products.length > 4}
            grabCursor
            breakpoints={{
              0: { slidesPerView: 1 },
              350: { slidesPerView: 2 },
              750: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
            className="product-swiper"
          >
            {products.map((product) => (
              <SwiperSlide key={product._id}>
                <div style={{ padding: "0 10px" }}>
                  <ProductCard product={product as unknown as GridProduct} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        <button
          className={`arrow-button arrow-left-${sliderId} arrow-left`}
          aria-label="Previous"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          className={`arrow-button arrow-right-${sliderId} arrow-right`}
          aria-label="Next"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductSlider;
