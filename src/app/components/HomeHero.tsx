"use client";
import React, { useEffect, useRef, useState } from "react";
import "../styles/home-hero.css";
import gsap from "gsap";
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";
import Link from "next/link";

const heroSlides = [
  {
    id: 1,
    title: "Define Your Style",
    subtitle: "New Season Clothing Collection",
    bg: "#1c1c1c",
    img: "/clothing-hero-1-desktop.jpg",
    mobileImg: "/clothing-hero-1-mobile.jpg",
  },
  {
    id: 2,
    title: "Effortless Elegance",
    subtitle: "Crafted for Every Occasion",
    bg: "#1c1c1c",
    img: "/clothing-hero-2-desktop.jpg",
    mobileImg: "/clothing-hero-2-mobile.jpg",
  },
  {
    id: 3,
    title: "Wear Your Confidence",
    subtitle: "Timeless Fits, Modern Comfort",
    bg: "#1c1c1c",
    img: "/clothing-hero-3-desktop.jpg",
    mobileImg: "/clothing-hero-3-mobile.jpg",
  },
];

const SLIDE_DELAY = 3000;
const DRAG_THRESHOLD = 60;

const HomeHero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const restartTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        animateIncoming(next);
        return next;
      });
    }, SLIDE_DELAY);
  };

  useEffect(() => {
    if (!imagesReady) return;
    restartTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesReady]);

  const handleNav = (action: () => void) => {
    action();
    restartTimer();
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
        <div
          className="hero-swiper"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`hero-slide${index === activeIndex ? " hero-slide-active" : ""}`}
            >
              <picture>
                {slide.mobileImg && (
                  <source
                    media="(max-width: 767px)"
                    srcSet={slide.mobileImg}
                  />
                )}
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="hero-slide-img"
                  ref={(el) => {
                    imgRefs.current[index] = el;
                  }}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  draggable={false}
                />
              </picture>
            </div>
          ))}
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

        {/* button */}
        <div className="hero-button">
          <Link href="/shop">
            <button>shop now</button>
          </Link>
        </div>
      </main>
    </>
  );
};

export default HomeHero;
