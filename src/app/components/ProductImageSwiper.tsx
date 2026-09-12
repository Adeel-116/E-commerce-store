"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Navigation } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "../styles/ProductImageFade.css";

interface ProductImageSwiperProps {
  images: string[];
  alt: string;
  onImageClick?: () => void;
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
}

export default function ProductImageSwiper({ images, alt, onImageClick, activeIndex, onIndexChange }: ProductImageSwiperProps) {
  return <ImageCarousel key={images.join("|")} images={images} alt={alt} onImageClick={onImageClick} activeIndexProp={activeIndex} onIndexChange={onIndexChange} />;
}

function ImageCarousel({ images, alt, onImageClick, activeIndexProp, onIndexChange }: ProductImageSwiperProps & { activeIndexProp?: number }) {
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperInstance | null>(null);
  const currentIndex = activeIndexProp !== undefined ? activeIndexProp : internalActiveIndex;

  useEffect(() => {
    if (swiperInstance && activeIndexProp !== undefined && swiperInstance.realIndex !== activeIndexProp) {
      swiperInstance.slideTo(activeIndexProp, 520);
    }
  }, [swiperInstance, activeIndexProp]);

  if (images.length === 0) return <div className="cg-card-image cg-card-image--empty" onClick={onImageClick} />;
  if (images.length === 1) return <img src={images[0]} alt={alt} title={alt} draggable={false} className="cg-card-image" onClick={onImageClick} />;

  return <div className="cg-card-image-swiper-wrap" onClick={onImageClick}>
    <Swiper onSwiper={setSwiperInstance} modules={[Navigation, EffectFade]} effect="fade" fadeEffect={{ crossFade: true }} navigation={{ prevEl, nextEl }} onSlideChange={(swiper) => { setInternalActiveIndex(swiper.realIndex); onIndexChange?.(swiper.realIndex); }} rewind speed={520} className="cg-card-image-swiper">
      {images.map((src, index) => <SwiperSlide key={`${src}-${index}`}><img src={src} alt={`${alt} ${index + 1}`} title={`${alt} ${index + 1}`} draggable={false} className="cg-card-image" /></SwiperSlide>)}
    </Swiper>
    <button ref={setPrevEl} type="button" className="cg-card-arrow cg-card-arrow-left" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} aria-label="Previous image"><ChevronLeft aria-hidden="true" /></button>
    <button ref={setNextEl} type="button" className="cg-card-arrow cg-card-arrow-right" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} aria-label="Next image"><ChevronRight aria-hidden="true" /></button>    <div className="cg-card-image-dots">{images.map((_, index) => <span key={index} className={`cg-card-image-dot${index === currentIndex ? " active" : ""}`} />)}</div>
  </div>;
}
