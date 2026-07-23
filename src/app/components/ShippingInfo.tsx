"use client";

import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "../styles/ShippingInfo.css";

const slides = [
  {
    title: "Free Delivery",
    text: "On orders over AED 200",
    icon: (
      <>
        <rect x="1" y="6" width="14" height="11" rx="1" />
        <path d="M15 10h4l3 3.5V17h-7z" />
        <circle cx="6" cy="19" r="1.7" />
        <circle cx="17.5" cy="19" r="1.7" />
      </>
    ),
  },
  {
    title: "Standard Delivery",
    text: "AED 20",
    icon: (
      <>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
  },
  {
    title: "Delivery Time",
    text: "1–3 Business Days Across UAE",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
];

function ShippingCardIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="icon-wrapper">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
    </div>
  );
}

export default function ShippingInfo() {
  return (
    <section className="shipping-info">
      {/* Desktop: a static 3-up row — nothing to carousel since all 3 always fit,
          and Swiper mis-measures the row width in this layout. */}
      <div className="shipping-row">
        {slides.map((item, index) => (
          <div className="shipping-card" key={index}>
            <ShippingCardIcon icon={item.icon} />
            <div className="content">
              <h4>{item.title}</h4>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: swipeable single-card carousel with dots */}
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        speed={900}
        pagination={{
          clickable: true,
        }}
        spaceBetween={12}
        slidesPerView={1}
        centeredSlides={false}
        className="shipping-swiper"
      >
        {slides.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="shipping-card">
              <ShippingCardIcon icon={item.icon} />
              <div className="content">
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
