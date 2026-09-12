"use client";
import { useEffect, useRef } from "react";
import "../styles/navbar2.css";
import "../styles/NavbarCompact.css";
import { BsBag } from "react-icons/bs";
import { FiUser, FiHeart } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import gsap from "gsap";
import { useCategories } from "../hooks/useCategories";
import { getCachedImageBlob } from "../lib/imageBlobCache";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Navbar2Inner = () => {
  const { user } = useAuth();
  const { cartItems, openCart } = useCart();
  const { wishlistItems } = useWishlist();
  const cartCount = cartItems.length;
  const wishlistCount = wishlistItems.length;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory =
    pathname === "/shop" ? searchParams.get("category") : null;
  const { categories } = useCategories();
  const visibleCategories = categories.map((category) => category.slug);
  const categoryLabels = Object.fromEntries(
    categories.map((category) => [category.slug, category.name]),
  );
  const isProfilePage = pathname === "/profile";
  const isCheckoutPage = pathname === "/checkout";
  // Only the home page has a full-bleed dark hero behind the nav — every
  // other page needs a solid background or the transparent nav is
  // unreadable against their light content.
  const isHomePage = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewCategorySlug, setPreviewCategorySlug] = useState("");
  const [previewHeading, setPreviewHeading] = useState("");
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const hasOpenedMenu = useRef(false);
  const isSolid = scrolled || isCheckoutPage || !isHomePage;
  const previewCategory =
    categories.find((category) => category.slug === previewCategorySlug) ??
    categories[0];


  useEffect(() => setMounted(true), []);

  // navbar is position:fixed (no reserved layout space, always pinned to the
  // viewport top). We only need scroll position to know when to switch its
  // background from transparent (over the hero) to solid black.
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const nextScrolled = window.scrollY > 20;
        setScrolled((current) =>
          current === nextScrolled ? current : nextScrolled,
        );
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initials = mounted && user ? getInitials(user.name) : null;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const drawer = document.querySelector<HTMLElement>(".navbar2-drawer");
    const overlay = document.querySelector<HTMLElement>(".navbar2-overlay");
    if (!drawer || !overlay) return;

    const links = drawer.querySelectorAll(".navbar2-drawer-links a");
    const headerItems = drawer.querySelectorAll(".navbar2-drawer-header > *");
    const footerItems = drawer.querySelectorAll(".navbar2-drawer-footer > *");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.killTweensOf([drawer, overlay, links, headerItems, footerItems]);

    if (menuOpen) {
      hasOpenedMenu.current = true;
      gsap.timeline()
        .set(drawer, { xPercent: 0, clipPath: "inset(0 0 0 100%)", visibility: "visible", pointerEvents: "auto" })
        .set(overlay, { visibility: "visible", pointerEvents: "auto" })
        .to(drawer, { clipPath: "inset(0 0 0 0%)", duration: reduceMotion ? 0 : 0.68, ease: "power4.inOut" })
        .to(overlay, { autoAlpha: 1, duration: reduceMotion ? 0 : 0.25 }, 0)
        .fromTo(headerItems, { y: -18, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: reduceMotion ? 0 : 0.45,
          stagger: 0.06, ease: "power3.out",
        }, reduceMotion ? 0 : 0.4)
        .fromTo(links, { yPercent: 70, x: 0, autoAlpha: 0 }, {
          yPercent: 0, x: 0, autoAlpha: 1, duration: reduceMotion ? 0 : 0.68,
          stagger: 0.07, ease: "power3.out",
        }, reduceMotion ? 0 : 0.46)
        .fromTo(footerItems, { y: 20, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: reduceMotion ? 0 : 0.45,
          stagger: 0.05, ease: "power3.out",
        }, reduceMotion ? 0 : 0.68);
    } else if (hasOpenedMenu.current) {
      gsap.timeline()
        .to([links, headerItems, footerItems], {
          x: 18, autoAlpha: 0, duration: reduceMotion ? 0 : 0.18,
          stagger: 0.015, ease: "power2.in",
        })
        .to(drawer, {
          clipPath: "inset(0 0 0 100%)", duration: reduceMotion ? 0 : 0.58,
          ease: "power4.inOut",
        }, reduceMotion ? 0 : 0.08)
        .to(overlay, { autoAlpha: 0, duration: reduceMotion ? 0 : 0.35 }, reduceMotion ? 0 : 0.08)
        .set([drawer, overlay], { visibility: "hidden", pointerEvents: "none" });
    } else {
      gsap.set(overlay, { autoAlpha: 0, visibility: "hidden" });
      gsap.set(drawer, { xPercent: 0, clipPath: "inset(0 0 0 100%)", visibility: "hidden", pointerEvents: "none" });
    }

    return () => {
      gsap.killTweensOf([drawer, overlay, links, headerItems, footerItems]);
    };
  }, [menuOpen]);
  useEffect(() => {
    if (!previewCategory?.image.url) {
      setPreviewImageUrl("");
      return;
    }

    let disposed = false;
    let objectUrl = "";
    const sourceUrl = previewCategory.image.url;
    setPreviewImageUrl(sourceUrl);

    getCachedImageBlob(sourceUrl)
      .then((blob) => {
        if (disposed) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewImageUrl(objectUrl);
      })
      .catch(() => {
        if (!disposed) setPreviewImageUrl(sourceUrl);
      });

    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewCategory?.image.url]);
  useEffect(() => {
    if (!menuOpen || !previewCategory) return;
    const image = document.querySelector(".navbar2-drawer-preview-image");
    if (!image) return;
    gsap.killTweensOf(image);
    gsap.fromTo(
      image,
      { autoAlpha: 0.35, scale: 1.055 },
      { autoAlpha: 1, scale: 1, duration: 0.65, ease: "power3.out" },
    );
  }, [menuOpen, previewCategory, previewCategorySlug]);
  const closeDrawer = () => {
    setMenuOpen(false);
  };

  const categoryLinkProps = (category: string) => {
    const active = activeCategory === category;
    return {
      className: active ? "navbar2-drawer-link--active" : "",
      "aria-current": active ? ("page" as const) : undefined,
      // Next.js <Link> is a no-op when the target URL matches the current
      // one, so tapping the already-active category in the mobile drawer
      // used to just preventDefault() and do nothing. Force a real reload
      // instead so it always refreshes the page/content, as on any other tap.
      onClick: closeDrawer,
    };
  };

  return (
    <>
      <nav
        className={`navbar2 ${isProfilePage ? "navbar2-profile" : ""} ${isSolid ? "navbar2--solid" : ""} ${scrolled ? "navbar2--scrolled" : ""}`}
      >
        <div className="navbar2-content">
          {/* left — logo */}
          <Link href={"/"}>
            <div className="navbar2-text-logo" id="nav-logo">
              <img
                src={isSolid ? "/white-version.avif" : "/updated-logo.avif"}
                alt="Zarya Style"
                title="Zarya Style"
                className="navbar2-brand-mark"
              />

            </div>
          </Link>

          {/* center — links (desktop only) */}
          <div className="navbar2-links">
            <Link href={"/"}>Home</Link>
            {visibleCategories.map((category) => (
              <Link
                key={category}
                href={`/shop?category=${category}`}
                {...categoryLinkProps(category)}
              >
                {categoryLabels[category] ?? category}
              </Link>
            ))}
          </div>

          {/* right — icons + hamburger */}
          <div className="navbar2-actions">
            <div className="navbar2-icon-wrap">
              <Link href="/wishlist">
                <FiHeart />
                {wishlistCount > 0 && (
                  <span className="navbar2-badge">{wishlistCount}</span>
                )}
              </Link>
            </div>
            <div
              className="navbar2-icon-wrap"
              onClick={openCart}
              style={{ cursor: "pointer" }}
            >
              <BsBag />
              {cartCount > 0 && (
                <span className="navbar2-badge">{cartCount}</span>
              )}
            </div>

            {/* profile — desktop only, hidden on mobile (lives in drawer) */}
            <Link
              className={`navbar2-profile-btn navbar2-profile-desktop ${initials ? "navbar2-profile-btn--avatar" : ""}`}
              href={initials ? "/profile" : "/login"}
              title={initials ? user?.name : "Login"}
            >
              {initials ? (
                <span className="navbar2-initials">{initials}</span>
              ) : (
                <FiUser />
              )}
            </Link>

            {/* hamburger — mobile only */}
            <button
              className={`navbar2-hamburger ${menuOpen ? "navbar2-hamburger--open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Dark overlay */}
      <div
        className={`navbar2-overlay ${menuOpen ? "navbar2-overlay--open" : ""}`}
        onClick={closeDrawer}
      />

      {/* Right-to-left drawer */}
      <div
        className={`navbar2-drawer ${menuOpen ? "navbar2-drawer--open" : ""}`}
      >
        <div className="navbar2-drawer-header">

          <button className="navbar2-drawer-close" onClick={closeDrawer} aria-label="Close menu">
            <span>Close</span>
            <i aria-hidden="true" />
          </button>
        </div>
        {/* Nav links */}
        <nav className="navbar2-drawer-links">
          <Link className={`navbar2-desktop-page-link${pathname === "/" ? " navbar2-drawer-link--active" : ""}`} href="/" onMouseEnter={() => setPreviewHeading("Home")} onClick={closeDrawer}>
            Home
          </Link>
          {visibleCategories.map((category) => (
            <Link
              key={category}
              href={`/shop?category=${category}`}
              onMouseEnter={() => {
                setPreviewCategorySlug(category);
                setPreviewHeading(categoryLabels[category] ?? category);
              }}
              {...categoryLinkProps(category)}
            >
              {categoryLabels[category] ?? category}
            </Link>
          ))}
          <Link className={`navbar2-desktop-page-link${pathname === "/about-us" ? " navbar2-drawer-link--active" : ""}`} href="/about-us" onMouseEnter={() => setPreviewHeading("About Us")} onClick={closeDrawer}>
            About Us
          </Link>
          <Link className={`navbar2-desktop-page-link${pathname === "/contact-us" ? " navbar2-drawer-link--active" : ""}`} href="/contact-us" onMouseEnter={() => setPreviewHeading("Contact Us")} onClick={closeDrawer}>
            Contact Us
          </Link></nav>
        <div className="navbar2-drawer-footer">
          <Link className="navbar2-drawer-cta" href="/contact-us" onMouseEnter={() => setPreviewHeading("Contact Us")} onClick={closeDrawer}>
            Contact us
          </Link>
        </div>
        {previewCategory && (
          <div className="navbar2-drawer-visual" aria-hidden="true">
            <img
              key={previewCategory.slug}
              className="navbar2-drawer-preview-image"
              src={previewImageUrl || previewCategory.image.url}
              alt=""
            />
            <div className="navbar2-drawer-visual-shade" />
            <div className="navbar2-drawer-visual-meta">
              <span>Explore category</span>
              <strong>{previewHeading || previewCategory.name}</strong>
              <small>{String(categories.findIndex((item) => item.slug === previewCategory.slug) + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}</small>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const Navbar2 = () => (
  <Suspense fallback={null}>
    <Navbar2Inner />
  </Suspense>
);

export default Navbar2;
