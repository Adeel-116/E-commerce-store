"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../styles/CategorySection.css";
import Image from "next/image";
import Link from "next/link";

interface Category {
  title: string;
  description: string;
  image: string;
  href: string;
}

const categories: Category[] = [
  {
    title: "Maxi",
    description: "Flowing silhouettes for effortless grace",
    image: "/category-maxi.jpg",
    href: "/shop?category=maxi",
  },
  {
    title: "Fashion",
    description: "Everyday styles with a modern edge",
    image: "/category-fashion.png",
    href: "/shop?category=fashion",
  },
  {
    title: "Top & Jeans",
    description: "Casual comfort, styled your way",
    image: "/category-top-jeans.png",
    href: "/shop?category=top-jeans",
  },
  {
    title: "Western",
    description: "Sharp, minimal, and versatile fits",
    image: "/category-western.png",
    href: "/shop?category=western",
  },
];

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={category.href} className="category-card">
      <Image
        src={category.image}
        alt={category.title}
        fill
        sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 25vw"
        objectPosition="bottom"
        className="category-card-image"
      />
      <div className="category-card-overlay" />
      <div className="category-card-content">
        <h3 className="category-card-title">{category.title}</h3>
        <p className="category-card-description">{category.description}</p>
        <span className="category-card-link">
          Shop Now
          <svg
            className="category-card-arrow"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function CategoryGrid() {
  return (
    <div className="category-grid">
      {categories.map((category) => (
        <div className="category-grid-item" key={category.title}>
          <CategoryCard category={category} />
        </div>
      ))}
    </div>
  );
}

function CategorySection() {
  return (
    <section className="category-section">
      <h1 className="dc-section-title dc-section-category-text" id="category-title">Our Categories</h1>
      <CategoryGrid />
      <Swiper
        modules={[A11y, Keyboard, Pagination]}
        keyboard={{ enabled: true }}
        grabCursor
        speed={600}
        pagination={{ el: ".category-pagination", clickable: true }}
        breakpoints={{
          320: { slidesPerView: 1.15, spaceBetween: 14 },
          768: { slidesPerView: 4, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 16, allowTouchMove: false },
          1440: { slidesPerView: 4, spaceBetween: 16, allowTouchMove: false },
        }}
        className="category-swiper"
      >
        {categories.map((category) => (
          <SwiperSlide key={category.title}>
            <CategoryCard category={category} />
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="category-pagination" />
    </section>
  );
}

export default CategorySection;