"use client";
import React, { useEffect, useRef, useState } from "react";
import "../styles/home-hero.css";
import gsap from "gsap";
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";
import Link from "next/link";

const heroSlides = [
  {
    id: 0,
    title: "Azadi Sale — Flat 20% Off",
    subtitle: "Use code AZADI79 at checkout",
    bg: "#1c1c1c",
    img: "/desktop-banner.avif",
    mobileImg: "/mobile-banner.avif",
    href: "/shop",
    promo: true,
    // Gets extra time on screen since there's more to read (offer, code, CTA)
    // than the plain lifestyle slides.
    delay: 5000,
  },
  {
    id: 1,
    title: "Define Your Style",
    subtitle: "New Season Clothing Collection",
    bg: "#1c1c1c",
    img: "/clothing-hero-1-desktop.avif",
    mobileImg: "/clothing-hero-1-mobile.avif",
  },
  {
    id: 2,
    title: "Effortless Elegance",
    subtitle: "Crafted for Every Occasion",
    bg: "#1c1c1c",
    img: "/clothing-hero-2-desktop.avif",
    mobileImg: "/clothing-hero-2-mobile.avif",
  },
  {
    id: 3,
    title: "Wear Your Confidence",
    subtitle: "Timeless Fits, Modern Comfort",
    bg: "#1c1c1c",
    img: "/clothing-hero-3-desktop.avif",
    mobileImg: "/clothing-hero-3-mobile.avif",
  },
];

const SLIDE_DELAY = 3000;
const DRAG_THRESHOLD = 60;

const HomeHero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragState = useRef<{ startX: number; dragging: boolean }>({
    startX: 0,
    dragging: false,
  });

  const animateIncoming = (index: number) => {
    const img = imgRefs.current[index];
    if (!img) return;
    gsap.killTweensOf(img);
    gsap.fromTo(
      img,
      { scale: 1.1 },
      { scale: 1, duration: 3, ease: "expo.out" },
    );
  };

  // Preload every slide image before the slider starts rotating, so a
  // transition never lands on a half-loaded image.
  useEffect(() => {
    let cancelled = false;
    const urls = heroSlides.flatMap((s) =>
      s.mobileImg ? [s.img, s.mobileImg] : [s.img],
    );
    Promise.all(
      urls.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          }),
      ),
    ).then(() => {
      if (!cancelled) setImagesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const goTo = (index: number) => {
    const next = (index + heroSlides.length) % heroSlides.length;
    setActiveIndex(next);
    animateIncoming(next);
  };

  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  // Each slide can carry its own on-screen delay (the promo slide gets
  // longer) — a self-rescheduling setTimeout reads the *current* slide's
  // delay before queuing the next tick, which a flat setInterval can't do.
  const restartTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const currentDelay = heroSlides[activeIndex]?.delay ?? SLIDE_DELAY;
    timerRef.current = setTimeout(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        animateIncoming(next);
        return next;
      });
    }, currentDelay);
  };

  useEffect(() => {
    if (!imagesReady) return;
    restartTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesReady, activeIndex]);

  // Restarting the auto-advance timer is handled by the activeIndex effect
  // above — it fires whenever goNext/goPrev/goTo changes the index, so a
  // manual nav (arrow click or drag) automatically gets a fresh countdown.
  const handleNav = (action: () => void) => {
    action();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    dragState.current = { startX: e.clientX, dragging: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    dragState.current.dragging = false;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      handleNav(delta < 0 ? goNext : goPrev);
    }
  };

  return (
    <>
      <main className="home-hero">
        <h1 className="sr-only">
          Zarya Style — Premium Everyday & Occasion Wear in Pakistan
        </h1>
        <div
          className="hero-swiper"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {heroSlides.map((slide, index) => {
            const media = (
              <picture>
                {slide.mobileImg && (
                  <source media="(max-width: 767px)" srcSet={slide.mobileImg} />
                )}
                <img
                  src={slide.img}
                  alt={slide.title}
                  title={slide.title}
                  className={`hero-slide-img${slide.promo ? " hero-slide-img--promo" : ""}`}
                  ref={(el) => {
                    imgRefs.current[index] = el;
                  }}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  draggable={false}
                />
              </picture>
            );

            return (
              <div
                key={slide.id}
                className={`hero-slide${index === activeIndex ? " hero-slide-active" : ""}`}
              >
                {slide.href ? (
                  <Link href={slide.href} className="hero-slide-link" aria-label={slide.title}>
                    {media}
                  </Link>
                ) : (
                  media
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Navigation Arrows */}
        <button
          className="hero-btn-prev hero-nav-btn"
          onClick={() => handleNav(goPrev)}
        >
          <SlArrowLeft />
        </button>
        <button
          className="hero-btn-next hero-nav-btn"
          onClick={() => handleNav(goNext)}
        >
          <SlArrowRight />
        </button>
      </main>
    </>
  );
};

export default HomeHero;
