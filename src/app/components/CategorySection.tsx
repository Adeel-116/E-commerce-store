"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Pagination } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";
import "../styles/CategorySection.css";
import { type StoreCategory, useCategories } from "../hooks/useCategories";

function CategoryCard({ category }: { category: StoreCategory }) {
  return (
    <Link href={"/shop?category=" + encodeURIComponent(category.slug)} className="category-card">
      <Image
        src={category.image.url}
        alt={category.name}
        title={category.name}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 45vw, 25vw"
        style={{ objectPosition: "top center" }}
        className="category-card-image"
      />
      <span className="category-card-badge">{category.name}</span>
    </Link>
  );
}

export default function CategorySection() {
  const { categories } = useCategories();
  const mobileCategoryNames = new Set(["kids collection", "western fashion", "pakistani fashion", "maxi"]);
  const mobileCategories = categories.filter((category, index, items) => {
    const name = category.name.trim().toLowerCase();
    return mobileCategoryNames.has(name) && items.findIndex((item) => item.name.trim().toLowerCase() === name) === index;
  });

  return (
    <section className="category-section">
      <div className="category-section-header">
        <p className="category-section-tag">Shop By Category</p>
        <h2 className="category-section-title" id="category-title">Our Categories</h2>
        <span className="category-section-divider" />
      </div>
      <div className="category-grid">
        {mobileCategories.map((category) => (
            <div className={`category-grid-item${["kids collection", "western fashion", "pakistani fashion", "maxi"].includes(category.name.trim().toLowerCase()) ? " category-grid-item--mobile-visible" : ""}`} key={category.slug}>
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
      <Swiper
        modules={[A11y, Keyboard, Pagination]}
        keyboard={{ enabled: true }}
        grabCursor
        speed={600}
        pagination={{ el: ".category-pagination", clickable: true }}
        breakpoints={{
          320: { slidesPerView: 1.15, spaceBetween: 14 },
          768: { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 16 },
          1440: { slidesPerView: 4, spaceBetween: 16 },
        }}
        className="category-swiper"
      >
        {categories.map((category) => (
          <SwiperSlide key={category.slug}>
            <CategoryCard category={category} />
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="category-pagination" />
    </section>
  );
}
