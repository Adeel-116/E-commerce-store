"use client";
import { useEffect } from "react";
import "../styles/navbar2.css";
import { BsBag } from "react-icons/bs";
import { FiUser, FiHeart } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Navbar2Inner = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { cartItems, openCart } = useCart();
  const { wishlistItems } = useWishlist();
  const cartCount = cartItems.length;
  const wishlistCount = wishlistItems.length;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory =
    pathname === "/shop" ? searchParams.get("category") : null;
  const isProfilePage = pathname === "/profile";
  const isCheckoutPage = pathname === "/checkout";
  // Only the home page has a full-bleed dark hero behind the nav — every
  // other page needs a solid background or the transparent nav is
  // unreadable against their light content.
  const isHomePage = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isSolid = scrolled || isCheckoutPage || !isHomePage;

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

  const closeDrawer = () => {
    setMenuOpen(false);
  };

  const categoryLinkProps = (category: string) => {
    const active = activeCategory === category;
    return {
      className: active ? "navbar2-drawer-link--active" : "",
      "aria-current": active ? ("page" as const) : undefined,
      onClick: active
        ? (e: React.MouseEvent) => e.preventDefault()
        : closeDrawer,
    };
  };

  return (
    <>
      <nav
        className={`navbar2 ${isProfilePage ? "navbar2-profile" : ""} ${isSolid ? "navbar2--solid" : ""}`}
      >
        <div className="navbar2-content">
          {/* left — logo */}
          <Link href={"/"}>
            <div className="navbar2-text-logo" id="nav-logo">
              <img
                src={isSolid ? "/white-version.png" : "/updated-logo.png"}
                alt="Zarya Style"
                className="navbar2-brand-mark"
              />

            </div>
          </Link>

          {/* center — links (desktop only) */}
          <div className="navbar2-links">
            <Link href={"/"}>Home</Link>
            <Link
              href={"/shop?category=western"}
              {...categoryLinkProps("western")}
            >
              Western Fashion
            </Link>
            <Link
              href={"/shop?category=top-jeans"}
              {...categoryLinkProps("top-jeans")}
            >
              Top & Jeans
            </Link>
            <Link
              href={"/shop?category=fashion"}
              {...categoryLinkProps("fashion")}
            >
              Pakistani Fashion
            </Link>
            <Link href={"/shop?category=maxi"} {...categoryLinkProps("maxi")}>
              Maxi
            </Link>
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
            <div
              className={`navbar2-profile-btn navbar2-profile-desktop ${initials ? "navbar2-profile-btn--avatar" : ""}`}
              onClick={() => router.push(initials ? "/profile" : "/login")}
              title={initials ? user?.name : "Login"}
            >
              {initials ? (
                <span className="navbar2-initials">{initials}</span>
              ) : (
                <FiUser />
              )}
            </div>

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
        {/* Profile section */}
        <div
          className="navbar2-drawer-profile"
          onClick={() => {
            router.push(initials ? "/profile" : "/login");
            closeDrawer();
          }}
        >
          <div
            className={`navbar2-drawer-avatar ${initials ? "navbar2-drawer-avatar--filled" : ""}`}
          >
            {initials ? <span>{initials}</span> : <FiUser size={20} />}
          </div>
          <div className="navbar2-drawer-profile-info">
            {initials ? (
              <>
                <p className="navbar2-drawer-profile-name">
                  {user?.name?.split(" ")[0]}
                </p>
                <p className="navbar2-drawer-profile-sub">View Profile →</p>
              </>
            ) : (
              <>
                <p className="navbar2-drawer-profile-name">Welcome</p>
                <p className="navbar2-drawer-profile-sub">Login / Register →</p>
              </>
            )}
          </div>
          <button
            className="navbar2-drawer-close"
            onClick={(e) => {
              e.stopPropagation();
              closeDrawer();
            }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav className="navbar2-drawer-links">
          <Link href={"/"} onClick={closeDrawer}>
            Home
          </Link>
          <Link
            href={"/shop?category=western"}
            {...categoryLinkProps("western")}
          >
            Western Fashion
          </Link>
          <Link
            href={"/shop?category=top-jeans"}
            {...categoryLinkProps("top-jeans")}
          >
            Top & Jeans
          </Link>
          <Link
            href={"/shop?category=fashion"}
            {...categoryLinkProps("fashion")}
          >
            Pakistani Fashion
          </Link>
          <Link href={"/shop?category=maxi"} {...categoryLinkProps("maxi")}>
            Maxi
          </Link>
          {!initials && (
            <>
              <Link href={"/login"} onClick={closeDrawer}>
                Login
              </Link>
              <Link href={"/register"} onClick={closeDrawer}>
                Register
              </Link>
            </>
          )}
        </nav>
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
