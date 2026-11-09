"use client";

interface ProductImageProps {
  images: string[];
  alt: string;
  activeIndex?: number;
  delivery?: Record<string, { src: string; srcSet?: string }>;
}

// Cards only need a showcase and hover photo, not a full gallery carousel.
export default function ProductImageSwiper({ images, alt, activeIndex = 0, delivery }: ProductImageProps) {
  const src = activeIndex > 0 ? images[1] || images[0] : images[0];
  if (!src) return <div className="cg-card-image cg-card-image--empty" />;
  const image = delivery?.[src];
  return <img src={image?.src || src} srcSet={image?.srcSet} sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 25vw" alt={alt} title={alt} loading="lazy" decoding="async" draggable={false} className="cg-card-image" />;
}
