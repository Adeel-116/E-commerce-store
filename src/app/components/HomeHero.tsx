"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/home-hero.css";
import gsap from "gsap";
import api from "../lib/axios";

type HeroSlide = { id: string | number; title: string; img: string; mobileImg: string; href: string; delay?: number; promo?: boolean; subtitle?: string; bg?: string; textless?: boolean };
type ApiBanner = { _id: string; title: string; href: string; textless?: boolean; desktop: { url: string }; mobile: { url: string } };
const defaultSlides: HeroSlide[] = [
  {
    id: "floral-editorial", title: "Floral Editorial", href: "/shop?category=fashion", textless: true,
    img: "https://res.cloudinary.com/kop736vp/image/upload/v1789768804/banners/floral-editorial-desktop.png",
    mobileImg: "https://res.cloudinary.com/kop736vp/image/upload/v1789768854/banners/floral-editorial-mobile.png",
  },
  // {
  //   id: 0,
  //   title: "Sale — Flat 20% Off",
  //   subtitle: "Use code STYLE20 at checkout",
  //   bg: "#1c1c1c",
  //   img: "/desktop-banner.avif",
  //   mobileImg: "/mobile-banner.avif",
  //   href: "/shop",
  
  //   // Gets extra time on screen since there's more to read (offer, code, CTA)
  //   // than the plain lifestyle slides.
  
  // },
  {
    id: 1,
    title: "Define Your Style",
    subtitle: "New Season Clothing Collection",
    bg: "#1c1c1c",
    img: "/clothing-hero-1-desktop.avif",
    mobileImg: "/clothing-hero-1-mobile.avif",
    href: "/shop",
    delay: 5000,
    promo: true,
  },
  {
    id: 2,
    title: "Effortless Elegance",
    subtitle: "Crafted for Every Occasion",
    bg: "#1c1c1c",
    img: "/clothing-hero-2-desktop.avif",
    mobileImg: "/clothing-hero-2-mobile.avif",
    href: "/shop",
  },
  {
    id: 3,
    title: "Wear Your Confidence",
    subtitle: "Timeless Fits, Modern Comfort",
    bg: "#1c1c1c",
    img: "/clothing-hero-3-desktop.avif",
    mobileImg: "/clothing-hero-3-mobile.avif",
    href: "/shop",
  },
];

const SLIDE_DELAY = 3000;
const DRAG_THRESHOLD = 60;

const HomeHero = () => {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(defaultSlides);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragState = useRef<{ startX: number; dragging: boolean }>({
    startX: 0,
    dragging: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    api.get<{ data: ApiBanner[] }>("/banners", { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted || !data.data.length) return;
      setImagesReady(false);
      setActiveIndex(0);
      setHeroSlides(data.data.map((banner) => ({
        id: banner._id, title: banner.title, href: banner.href,
        img: banner.desktop.url, mobileImg: banner.mobile.url, promo: true,
        textless: banner.textless ?? ["Floral Editorial", "Blue Floral Maxi"].includes(banner.title),
      })));
    }).catch(() => { /* Keep the default banners if the API is unavailable. */ });
    return () => controller.abort();
  }, []);

  const animateIncoming = (index: number) => {
    const img = imgRefs.current[index];
    if (!img) return;
    gsap.killTweensOf(img);
    const copy = document.querySelectorAll(
      '.hero-slide[data-index="' + index + '"] .hero-copy-reveal',
    );
    gsap.killTweensOf(copy);
    gsap.fromTo(img, { scale: 1.1 }, { scale: 1, duration: 1.5, ease: "power3.out" });
    gsap.fromTo(
      copy,
      { y: 42, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" },
    );
  };

  // Preload every slide image before the slider starts rotating, so a
  // transition never lands on a half-loaded image.
  useEffect(() => {
    let cancelled = false;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const urls = heroSlides.map((s) => mobile ? s.mobileImg : s.img);
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
  }, [heroSlides]);

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
    if (!imagesReady || heroSlides.length < 2) return;
    restartTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesReady, activeIndex, heroSlides]);

  // Restarting the auto-advance timer is handled by the activeIndex effect
  // above — it fires whenever goNext/goPrev/goTo changes the index, so a
  // manual nav (arrow click or drag) automatically gets a fresh countdown.
  const handleNav = (action: () => void) => {
    action();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (heroSlides.length < 2) return;
    dragState.current = { startX: e.clientX, dragging: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    dragState.current.dragging = false;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      handleNav(delta < 0 ? goNext : goPrev);
    }
  };

  const cancelDrag = () => {
    dragState.current.dragging = false;
  };

  return (
    <main className="home-hero">
      <h1 className="sr-only">Zarya Style — Premium Everyday & Occasion Wear in Pakistan</h1>
      <div className="hero-swiper" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}>
        {heroSlides.map((slide, index) => (
          <div key={slide.id} data-index={index} className={"hero-slide" + (index === activeIndex ? " hero-slide-active" : "") + (slide.textless ? " hero-slide--textless" : "")} aria-hidden={index !== activeIndex}>
            {!slide.textless && <div className="hero-split-copy">
              <div className="hero-copy-top hero-copy-reveal"><span>Collection</span><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="hero-copy-main">
                <p className="hero-copy-eyebrow hero-copy-reveal">Zarya Style / New Edit</p>
                <h2 className="hero-copy-reveal">{slide.title}</h2>
                <p className="hero-copy-description hero-copy-reveal">{slide.subtitle || "A considered edit of modern silhouettes and timeless detail."}</p>
                <Link href={slide.href} className="hero-copy-cta hero-copy-reveal">Explore collection <ArrowUpRight size={18} strokeWidth={1.6} /></Link>
              </div>
              <div className="hero-copy-bottom hero-copy-reveal"><span>Designed for your story</span><span>Pakistan · 2026</span></div>
            </div>}
            <div className="hero-split-media">
              <picture><source media="(max-width: 767px)" srcSet={slide.mobileImg} /><img src={slide.img} alt={slide.title} title={slide.title} className="hero-slide-img" ref={(element) => { imgRefs.current[index] = element; }} fetchPriority={index === 0 ? "high" : "auto"} draggable={false} /></picture>
              {!slide.textless && <div className="hero-media-shade" />}
              {/* <div className="hero-media-top"><span>Premium womenswear</span><span>Zarya Style</span></div> */}
              {!slide.textless && <div className="hero-media-caption"><span>{String(index + 1).padStart(2, "0")}</span><p>{slide.title}</p></div>}
            </div>
          </div>
        ))}
        {heroSlides.length > 1 && (
          <>
            <div className="hero-nav">
              <button type="button" onClick={() => handleNav(goPrev)} aria-label="Previous banner"><ChevronLeft aria-hidden="true" /></button>
              <button type="button" onClick={() => handleNav(goNext)} aria-label="Next banner"><ChevronRight aria-hidden="true" /></button>
            </div>
            <div className="hero-progress" aria-label="Choose banner">
              {heroSlides.map((slide, index) => (
                <button type="button" key={slide.id} className={index === activeIndex ? "is-active" : ""} onClick={() => goTo(index)} aria-label={"Go to banner " + (index + 1)} aria-current={index === activeIndex ? "true" : undefined}>
                  <span>{String(index + 1).padStart(2, "0")}</span><i />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );};

export default HomeHero;
