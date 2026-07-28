"use client";
import "../styles/stick-navbar.css";
import "../styles/navbar2.css"
import { IoIosHeartEmpty, IoIosSearch } from "react-icons/io";
import { BsBag } from "react-icons/bs";
import { FiUser } from "react-icons/fi";
import Link from "next/link";
import { Suspense, useState, useRef, useEffect } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useFilter } from "../context/FilterContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import axios from "axios";
import { gaSearch } from "../lib/gaEvents";

const SUGGESTIONS_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/getTitleSuggestion`;
const FILTER_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/universalFilter`;

type TitleSuggestion = {
  _id: string;
  title: string;
  slug?: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const StickNavbarInner = () => {
  const { wishlistItems } = useWishlist();
  const { cartItems, openCart } = useCart();
  const { user, loading } = useAuth();
  const { saveFilter } = useFilter();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = pathname === "/shop" ? searchParams.get("category") : null;
  const wishlistCount = wishlistItems.length;
  const cartCount = cartItems.length;
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = !loading && !!user?.name;
  const initials = loading ? null : user?.name ? getInitials(user.name) : null;

  // lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(SUGGESTIONS_URL, {
          params: { search: trimmed, limit: 5 },
        });
        const list: TitleSuggestion[] = data?.success ? (data.data ?? []) : [];
        setSuggestions(list);
        setShowDropdown(list.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToShop = (searchTerm: string) => {
    setShowDropdown(false);
    const trimmed = searchTerm.trim();
    if (trimmed) gaSearch({ searchString: trimmed });
    saveFilter({ title: searchTerm || undefined, page: 1, limit: 15 });
    router.push("/shop");
  };

  const handleSuggestionClick = async (suggestion: TitleSuggestion) => {
    setShowDropdown(false);
    setQuery("");
    if (suggestion.slug || suggestion._id) {
      router.push(`/shop/${suggestion.slug ?? suggestion._id}`);
      return;
    }
    try {
      const { data } = await axios.get(FILTER_URL, {
        params: { title: suggestion.title, limit: 5, status: "active" },
      });
      const product = data?.data?.[0];
      const slug = product?.slug ?? product?._id;
      if (slug) {
        router.push(`/shop/${slug}`);
      } else {
        goToShop(suggestion.title);
      }
    } catch {
      goToShop(suggestion.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") goToShop(query.trim());
    if (e.key === "Escape") setShowDropdown(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const categoryLinkProps = (category: string) => {
    const active = activeCategory === category;
    return {
      className: active ? "snb-drawer-link--active" : "",
      "aria-current": active ? ("page" as const) : undefined,
      onClick: active
        ? (e: React.MouseEvent) => e.preventDefault()
        : closeDrawer,
    };
  };

  return (
    <>
      <div className="stick-navbar">
        <div className="stick-navbar-container">

          {/* left — logo */}
          <div className="snb-left">
            <Link href={"/"}>
              <div className="navbar2-text-logo">
                <img src="/white-version.avif" alt="Zarya Style" title="Zarya Style" className="navbar2-brand-logo" />
              </div>
            </Link>
          </div>

          {/* center — links (hidden on tablet, shown on desktop) */}
          <div className="snb-center">
            <div className="stick-navbar-links">
              <Link href={"/"}>home</Link>
              <Link href={"/shop?category=western"} {...categoryLinkProps("western")}>Western Fashion</Link>
              <Link href={"/shop?category=top-jeans"} {...categoryLinkProps("top-jeans")}>Top & Jeans</Link>
              <Link href={"/shop?category=fashion"} {...categoryLinkProps("fashion")}>Pakistani Fashion</Link>
              <Link href={"/shop?category=maxi"} {...categoryLinkProps("maxi")}>Maxi</Link>
            </div>
          </div>

          {/* right — search + icons + hamburger */}
          <div className="snb-right">
            {/* search — desktop only */}
            <div className="snb-search-wrap" ref={wrapperRef}>
              <div className="stick-navbar-search">
                <IoIosSearch
                  style={{ cursor: "pointer" }}
                  onClick={() => goToShop(query.trim())}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                />
              </div>
              {showDropdown && suggestions.length > 0 && (
                <ul className="snb-suggestions">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion._id}
                      className="snb-suggestion-item"
                      onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestion); }}
                    >
                      <IoIosSearch className="snb-suggestion-icon" />
                      <span>{suggestion.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* icons */}
            <div className="stick-navbar-cart-section">
              <div className="stick-navbar-icon-wrap">
                <Link href="/wishlist">
                  <IoIosHeartEmpty size={22} />
                </Link>
                {wishlistCount > 0 && (
                  <span className="stick-navbar-badge">{wishlistCount}</span>
                )}
              </div>
              <div
                className="stick-navbar-icon-wrap"
                onClick={openCart}
                style={{ cursor: "pointer" }}
              >
                <BsBag size={18} />
                {cartCount > 0 && (
                  <span className="stick-navbar-badge">{cartCount}</span>
                )}
              </div>
              {/* profile — desktop only (tablet shows in drawer) */}
              <div
                className={`snb-profile-desktop navbar2-profile-btn ${isAuthenticated ?  "navbar2-profile-btn--avatar" : ""}`}
                onClick={() => router.push(isAuthenticated ? "/profile" : "/login")}
                title={initials ? user?.name : "Login"}
              >
                {initials ? (
                  <span className="navbar2-initials">{initials}</span>
                ) : (
                  <FiUser size={20} />
                )}
              </div>
            </div>

            {/* hamburger — tablet only */}
            <button
              className={`snb-hamburger ${drawerOpen ? "snb-hamburger--open" : ""}`}
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>

        </div>
      </div>

      {/* Overlay */}
      <div
        className={`snb-overlay ${drawerOpen ? "snb-overlay--open" : ""}`}
        onClick={closeDrawer}
      />

      {/* Right-to-left drawer */}
      <div className={`snb-drawer ${drawerOpen ? "snb-drawer--open" : ""}`}>

        {/* Profile section */}
        <div
          className="snb-drawer-profile"
          onClick={() => { router.push(initials ? "/profile" : "/login"); closeDrawer(); }}
        >
          <div className={`snb-drawer-avatar ${initials ? "snb-drawer-avatar--filled" : ""}`}>
            {initials ? <span>{initials}</span> : <FiUser size={20} />}
          </div>
          <div className="snb-drawer-profile-info">
            <div className="snb-drawer-profile-text">
              {initials ? (
                <>
                  <p className="snb-drawer-profile-name">{user?.name?.split(" ")[0]}</p>
                  <p className="snb-drawer-profile-sub">View Profile →</p>
                </>
              ) : (
                <>
                  <p className="snb-drawer-profile-name">Welcome</p>
                  <p className="snb-drawer-profile-sub">Login / Register →</p>
                </>
              )}
            </div>
            <button
              className="snb-drawer-close"
              onClick={(e) => { e.stopPropagation(); closeDrawer(); }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="snb-drawer-links">
          <Link href={"/"} onClick={closeDrawer}>Home</Link>
          <Link href={"/shop?category=western"} {...categoryLinkProps("western")}>Western Fashion</Link>
          <Link href={"/shop?category=top-jeans"} {...categoryLinkProps("top-jeans")}>Top & Jeans</Link>
          <Link href={"/shop?category=fashion"} {...categoryLinkProps("fashion")}>Pakistani Fashion</Link>
          <Link href={"/shop?category=maxi"} {...categoryLinkProps("maxi")}>Maxi</Link>
          {!isAuthenticated && (
            <>
              <Link href={"/login"} onClick={closeDrawer}>Login</Link>
              <Link href={"/register"} onClick={closeDrawer}>Register</Link>
            </>
          )}
        </nav>

      </div>
    </>
  );
};

const StickNavbar = () => (
  <Suspense fallback={null}>
    <StickNavbarInner />
  </Suspense>
);

export default StickNavbar;
