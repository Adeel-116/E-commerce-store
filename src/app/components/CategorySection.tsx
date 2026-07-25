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
  image: string;
  href: string;
}

const categories: Category[] = [
  {
    title: "Western Fashion",
    image: "/category-western.png",
    href: "/shop?category=western",
  },
  {
    title: "Top & Jeans",
    image: "/category-top-jeans.png",
    href: "/shop?category=top-jeans",
  },
  {
    title: "Pakistani Fashion",
    image: "/category-fashion.png",
    href: "/shop?category=fashion",
  },
  {
    title: "Maxi",
    image: "/category-maxi.jpg",
    href: "/shop?category=maxi",
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
        objectPosition="top center"
        className="category-card-image"
      />
      <span className="category-card-badge">{category.title}</span>
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
      <div className="category-section-header">
        <p className="category-section-tag">Shop By Category</p>
        <h2 className="category-section-title" id="category-title">Our Categories</h2>
        <span className="category-section-divider" />
      </div>
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