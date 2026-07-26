"use client";

import { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/navigation";

interface ProductImageSwiperProps {
  images: string[];
  alt: string;
  onImageClick?: () => void;
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
}

export default function ProductImageSwiper({
  images,
  alt,
  onImageClick,
  activeIndex,
  onIndexChange,
}: ProductImageSwiperProps) {
  return (
    <ImageCarousel
      key={images.join("|")}
      images={images}
      alt={alt}
      onImageClick={onImageClick}
      activeIndexProp={activeIndex}
      onIndexChange={onIndexChange}
    />
  );
}

function ImageCarousel({
  images,
  alt,
  onImageClick,
  activeIndexProp,
  onIndexChange,
}: ProductImageSwiperProps & { activeIndexProp?: number }) {
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperInstance | null>(
    null,
  );

  const currentIndex =
    activeIndexProp !== undefined ? activeIndexProp : internalActiveIndex;

  useEffect(() => {
    if (
      swiperInstance &&
      activeIndexProp !== undefined &&
      swiperInstance.realIndex !== activeIndexProp
    ) {
      if (images.length > 2) {
        swiperInstance.slideToLoop(activeIndexProp);
      } else {
        swiperInstance.slideTo(activeIndexProp);
      }
    }
  }, [swiperInstance, activeIndexProp, images.length]);

  if (images.length === 0) {
    return (
      <div
        className="cg-card-image cg-card-image--empty"
        onClick={onImageClick}
      />
    );
  }

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        title={alt}
        draggable={false}
        className="cg-card-image"
        onClick={onImageClick}
      />
    );
  }

  return (
    <div className="cg-card-image-swiper-wrap" onClick={onImageClick}>
      <Swiper
        onSwiper={setSwiperInstance}
        modules={[Navigation]}
        navigation={{ prevEl, nextEl }}
        onSlideChange={(swiper) => {
          setInternalActiveIndex(swiper.realIndex);
          if (onIndexChange) onIndexChange(swiper.realIndex);
        }}
        loop={images.length > 2}
        speed={350}
        className="cg-card-image-swiper"
      >
        {images.map((src, i) => (
          <SwiperSlide key={`${src}-${i}`}>
            <img
              src={src}
              alt={`${alt} ${i + 1}`}
              title={`${alt} ${i + 1}`}
              draggable={false}
              className="cg-card-image"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        ref={setPrevEl}
        type="button"
        className="cg-card-arrow cg-card-arrow-left"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        ref={setNextEl}
        type="button"
        className="cg-card-arrow cg-card-arrow-right"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Next image"
      >
        ›
      </button>

      <div className="cg-card-image-dots">
        {images.map((_, i) => (
          <span
            key={i}
            className={`cg-card-image-dot${i === currentIndex ? " active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
