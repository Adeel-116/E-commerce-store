"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "../styles/ShopPage.css";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import NavbarController from "../components/NavbarController";
import VideoSlider from "../components/VideoSlider";
import api from "../lib/axios";
import { ShopGridSkeleton } from "../components/Skeleton";

export type ShopProduct = {
  _id: string;
  productId: number;
  title: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  category: string[];
  sizes: string[];
  isNew: boolean;
  stock: boolean;
  status: "active" | "inactive";
  activeDiscount: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  } | null;
};

export const CATEGORY_LABELS: Record<string, string> = {
  maxi: "Maxi",
  fashion: "Fashion",
  "top-jeans": "Top & Jeans",
  western: "Western",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

const PAGE_SIZE = 9;
// Fixed, generous bounds for the price slider — avoids extra round-trips just
// to compute exact min/max from the catalog; the slider stays a sensible UX
// nudge rather than a precise histogram.
const PRICE_MIN = 0;
const PRICE_MAX = 10000;

function getPaginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 1) return [1];
  const delta = 1;
  const range: (number | "...")[] = [];
  let prev: number | null = null;

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      if (prev !== null && i - prev > 1) range.push("...");
      range.push(i);
      prev = i;
    }
  }
  return range;
}

function getDiscountPercent(product: ShopProduct): number | null {
  return product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;
}

function ShopPageContent() {
  const { addToCart, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    categoryParam && CATEGORIES.includes(categoryParam) ? categoryParam : undefined
  );
  const [inStock, setInStock] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [sort, setSort] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openSections, setOpenSections] = useState({
    category: true,
    availability: true,
    price: true,
  });

  const [priceRange, setPriceRange] = useState({ min: PRICE_MIN, max: PRICE_MAX });
  const [stockCounts, setStockCounts] = useState({ inStock: 0, outOfStock: 0 });

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch in-stock / out-of-stock counts for the current category — cheap
  // (limit=1, only the `total` field is used) and keeps the sidebar counts
  // accurate without pulling the whole catalog client-side.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const base: Record<string, string> = { status: "active" };
        if (selectedCategory) base.category = selectedCategory;

        const [inRes, outRes] = await Promise.all([
          api.get("/universalFilter", { params: { ...base, stock: "true", limit: 1 } }),
          api.get("/universalFilter", { params: { ...base, stock: "false", limit: 1 } }),
        ]);

        if (cancelled) return;
        setStockCounts({
          inStock: inRes.data?.total ?? 0,
          outOfStock: outRes.data?.total ?? 0,
        });
      } catch {
        if (!cancelled) setStockCounts({ inStock: 0, outOfStock: 0 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  // Main product fetch — server-side filtering/pagination.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          status: "active",
          page: currentPage,
          limit: PAGE_SIZE,
        };

        if (selectedCategory) params.category = selectedCategory;
        if (inStock !== outOfStock) params.stock = inStock ? "true" : "false";
        if (priceRange.min > PRICE_MIN) params.minPrice = priceRange.min;
        if (priceRange.max < PRICE_MAX) params.maxPrice = priceRange.max;
        if (sort === "newest" || sort === "price-asc" || sort === "price-desc") {
          params.sort = sort;
        }

        const { data } = await api.get("/universalFilter", { params });
        if (cancelled) return;

        let list: ShopProduct[] = data?.data ?? [];
        if (sort === "name_a_z") {
          list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === "name_z_a") {
          list = [...list].sort((a, b) => b.title.localeCompare(a.title));
        }

        setProducts(list);
        setTotal(data?.total ?? 0);
        setTotalPages(data?.totalPages ?? 1);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, inStock, outOfStock, sort, currentPage, priceRange.min, priceRange.max]);

  const pageTitle = selectedCategory ? CATEGORY_LABELS[selectedCategory] : "Shop";

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategory(checked ? category : undefined);
    setCurrentPage(1);
  };

  const handleInStockChange = (checked: boolean) => {
    setInStock(checked);
    setCurrentPage(1);
  };

  const handleOutOfStockChange = (checked: boolean) => {
    setOutOfStock(checked);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setInStock(false);
    setOutOfStock(false);
    setSort("");
    setCurrentPage(1);
    setPriceRange({ min: PRICE_MIN, max: PRICE_MAX });
  };

  const renderFilterOptions = (variant: "sidebar" | "modal") => (
    <>
      {/* Products Category */}
      <div
        className={`shop-page__sidebar-section${variant === "sidebar" ? " shop-page__sidebar-section--filter" : ""
          }`}
      >
        <button
          type="button"
          className="shop-page__sidebar-title-row"
          onClick={() => toggleSection("category")}
        >
          <h3 className="shop-page__sidebar-title">Products Category</h3>
          <span className="shop-page__sidebar-toggle">{openSections.category ? "−" : "+"}</span>
        </button>
        {openSections.category && (
          <div className="shop-page__sidebar-section-body">
            {CATEGORIES.map((category) => (
              <label className="shop-page__checkbox-label" key={category}>
                <input
                  type="checkbox"
                  checked={selectedCategory === category}
                  onChange={(e) => handleCategoryChange(category, e.target.checked)}
                />
                <span>{CATEGORY_LABELS[category]}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div
        className={`shop-page__sidebar-section${variant === "sidebar" ? " shop-page__sidebar-section--filter" : ""
          }`}
      >
        <button
          type="button"
          className="shop-page__sidebar-title-row"
          onClick={() => toggleSection("availability")}
        >
          <h3 className="shop-page__sidebar-title">Availability</h3>
          <span className="shop-page__sidebar-toggle">{openSections.availability ? "−" : "+"}</span>
        </button>
        {openSections.availability && (
          <div className="shop-page__sidebar-section-body">
            <label className="shop-page__checkbox-label">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => handleInStockChange(e.target.checked)}
              />
              <span>In stock ({stockCounts.inStock})</span>
            </label>
            <label className="shop-page__checkbox-label">
              <input
                type="checkbox"
                checked={outOfStock}
                onChange={(e) => handleOutOfStockChange(e.target.checked)}
              />
              <span>Out of stock ({stockCounts.outOfStock})</span>
            </label>
          </div>
        )}
      </div>

      {/* Price */}
      <div
        className={`shop-page__sidebar-section${variant === "sidebar" ? " shop-page__sidebar-section--filter" : ""
          }`}
      >
        <button
          type="button"
          className="shop-page__sidebar-title-row"
          onClick={() => toggleSection("price")}
        >
          <h3 className="shop-page__sidebar-title">Price</h3>
          <span className="shop-page__sidebar-toggle">{openSections.price ? "−" : "+"}</span>
        </button>
        {openSections.price && (
          <div className="shop-page__sidebar-section-body">
            <div className="shop-page__price-inputs">
              <input
                type="number"
                className="shop-page__price-input"
                value={priceRange.min}
                min={PRICE_MIN}
                max={priceRange.max}
                onChange={(e) => {
                  setPriceRange((prev) => ({ ...prev, min: Number(e.target.value) }));
                  setCurrentPage(1);
                }}
              />
              <span className="shop-page__price-dash">—</span>
              <input
                type="number"
                className="shop-page__price-input"
                value={priceRange.max}
                min={priceRange.min}
                max={PRICE_MAX}
                onChange={(e) => {
                  setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }));
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="shop-page__price-slider-wrap">
              <div className="shop-page__price-track">
                <div
                  className="shop-page__price-fill"
                  style={{
                    left: `${((priceRange.min - PRICE_MIN) / (PRICE_MAX - PRICE_MIN || 1)) * 100}%`,
                    right: `${100 - ((priceRange.max - PRICE_MIN) / (PRICE_MAX - PRICE_MIN || 1)) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  className="shop-page__range-input shop-page__range-input--min"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  value={priceRange.min}
                  onChange={(e) => {
                    setPriceRange((prev) => ({
                      ...prev,
                      min: Math.min(Number(e.target.value), prev.max),
                    }));
                    setCurrentPage(1);
                  }}
                />
                <input
                  type="range"
                  className="shop-page__range-input shop-page__range-input--max"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  value={priceRange.max}
                  onChange={(e) => {
                    setPriceRange((prev) => ({
                      ...prev,
                      max: Math.max(Number(e.target.value), prev.min),
                    }));
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <p className="shop-page__price-labels">
              Price: <span className="shop-page__price-label-val">Rs.{priceRange.min.toLocaleString()}</span>
              {" — "}
              <span className="shop-page__price-label-val">Rs.{priceRange.max.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="shop-page">
      <NavbarController />

      {/* Header */}
      <div className="shop-page__header">
        <p className="shop-page__header-breadcrumb">
          <Link href="/">Home</Link> / {pageTitle}
        </p>
        <h1 className="shop-page__title">{pageTitle}</h1>
      </div>

      {/* Main Content */}
      <div className="shop-page__body">
        {/* Sidebar */}
        <aside className="shop-page__sidebar">
          {renderFilterOptions("sidebar")}

          <button
            type="button"
            className="shop-page__filter-btn"
            onClick={() => setShowFilterModal(true)}
          >
            Filter
          </button>
        </aside>

        {/* Mobile Filter Popup */}
        {showFilterModal && (
          <div
            className="shop-filter-modal-backdrop"
            onClick={() => setShowFilterModal(false)}
          />
        )}
        <div
          className={`shop-filter-modal${showFilterModal ? " open" : ""}`}
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
        >
          <div className="shop-filter-modal-header">
            <h3 className="shop-filter-modal-title">Filter</h3>
            <button
              type="button"
              className="shop-filter-modal-close"
              onClick={() => setShowFilterModal(false)}
              aria-label="Close filters"
            >
              ×
            </button>
          </div>
          <div className="shop-filter-modal-body">{renderFilterOptions("modal")}</div>
          <button
            type="button"
            className="shop-filter-modal-apply"
            onClick={() => setShowFilterModal(false)}
          >
            Apply Filters
          </button>
        </div>

        {/* Products Area */}
        <div className="shop-page__products-wrapper">
          {/* Toolbar */}
          <div className="shop-page__toolbar">
            <p className="shop-page__result-count">
              There are {total} results in total
            </p>

            <div className="shop-page__toolbar-right">
              <div className="shop-page__view-toggle">
                <button
                  type="button"
                  className={`shop-page__view-btn${viewMode === "grid" ? " active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`shop-page__view-btn${viewMode === "list" ? " active" : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="shop-page__sort-wrap">
                <span className="shop-page__sort-label">Sort by:</span>
                <select className="shop-page__sort-select" value={sort} onChange={handleSortChange}>
                  <option value="">Best selling</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name_a_z">Name A–Z</option>
                  <option value="name_z_a">Name Z–A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="shop-page-grid-container">
            {loading ? (
              <ShopGridSkeleton count={PAGE_SIZE} />
            ) : products.length === 0 ? (
              <div className="shop-page__empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <h2 className="shop-page__empty-title">No products found</h2>
                <p className="shop-page__empty-sub">
                  Try adjusting your filters to find what you&apos;re looking for.
                </p>
                <button className="shop-page__empty-reset" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`shop-page__grid${viewMode === "list" ? " shop-page__grid--list" : ""}`}>
                {products.map((product) => {
                  const wishlisted = isWishlisted(product._id);
                  const discountPercent = getDiscountPercent(product);
                  const firstSize = product.sizes?.[0];
                  const canAddToCart = product.stock && !!firstSize;

                  return (
                    <div className="shop-page__card" key={product._id}>
                      <div className="shop-page__card-image-wrap">
                        <div className="shop-page-badges">
                          <div className="shop-page-badges__left">
                            {discountPercent !== null && (
                              <span className="shop-page__badge">-{discountPercent}%</span>
                            )}
                            {product.isNew && (
                              <span className="shop-page__badge-new">New</span>
                            )}
                            {!product.stock && (
                              <span className="shop-page__badge--out">Out of Stock</span>
                            )}
                          </div>

                          <button
                            className={`shop-page__wishlist-btn ${wishlisted ? "shop-page__wishlist-btn--active" : ""}`}
                            onClick={() =>
                              toggleWishlist({
                                id: product._id,
                                name: product.title,
                                image: product.images[0],
                                stock: product.stock,
                                price: product.price,
                                sizes: product.sizes,
                              })
                            }
                            aria-label="Add to wishlist"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill={wishlisted ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                        </div>

                        <Link href={`/shop/${product.slug}`} style={{ display: "block", height: "100%" }}>
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="shop-page__card-image"
                          />
                        </Link>
                      </div>

                      <div className="shop-page__card-info">
                        <Link href={`/shop/${product.slug}`}>
                          <p className="shop-page__card-name">{product.title}</p>
                        </Link>

                        <div className="shop-page__card-pricing">
                          <span className="shop-page__card-price shop-page__card-price--current">
                            Rs.{product.price.toLocaleString()}
                          </span>
                          {product.comparePrice && (
                            <span className="shop-page__card-price shop-page__card-price--original">
                              Rs.{product.comparePrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <button
                          className="shop-page__add-to-cart"
                          disabled={!canAddToCart}
                          onClick={() =>
                            canAddToCart &&
                            firstSize &&
                            (addToCart({
                              id: product._id,
                              productName: product.title,
                              brand: "",
                              price: product.price,
                              size: firstSize,
                              productImage: product.images[0],
                            }),
                              openCart())
                          }
                        >
                          {!product.stock ? "Sold Out" : !firstSize ? "Unavailable" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="shop-pagination-buttons">
              <div className="shop-page-pagination-container">
                <button
                  className="shop-pagination-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>

                {getPaginationRange(currentPage, totalPages).map((item, index) =>
                  item === "..." ? (
                    <span key={`dots-${index}`} className="dots">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      className={`shop-pagination-btn ${currentPage === item ? "active" : ""}`}
                      onClick={() => goToPage(item as number)}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  className="shop-pagination-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <VideoSlider />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageContent />
    </Suspense>
  );
}
