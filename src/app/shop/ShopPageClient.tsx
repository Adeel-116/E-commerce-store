"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import "../styles/ShopPage.css";
import NavbarController from "../components/NavbarController";
import VideoSlider from "../components/VideoSlider";
import api from "../lib/axios";
import { ProductCard, type GridProduct } from "../components/ProductGrid";
import LoadingRing from "../components/LoadingRing";
import { CATEGORY_LABELS, type ShopProduct } from "./constants";
import { gaViewItemList } from "../lib/gaEvents";
import { getCachedProductResponse, warmProductImages } from "../lib/storefrontCache";

const PAGE_SIZE = 9;
// Fixed, generous bounds for the price slider â€” avoids extra round-trips just
// to compute exact min/max from the catalog; the slider stays a sensible UX
// nudge rather than a precise histogram.
const PRICE_MIN = 0;
const PRICE_MAX = 100000;

type ProductSuggestion = { _id: string; title: string; slug?: string };

function getPaginationRange(
  current: number,
  total: number,
): (number | "...")[] {
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

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    categoryParam || undefined,
  );
  const [inStock, setInStock] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [stitching, setStitching] = useState<"" | "stitched" | "unstitched">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openSections, setOpenSections] = useState({
    availability: true,
    stitching: true,
    price: true,
  });

  const [priceRange, setPriceRange] = useState({
    min: PRICE_MIN,
    max: PRICE_MAX,
  });
  const [stockCounts, setStockCounts] = useState({ inStock: 0, outOfStock: 0 });

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get("/getTitleSuggestion", {
          params: { search: trimmed, limit: 6 },
          signal: controller.signal,
        });
        const list = data?.success ? (data.data ?? []) : [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Fetch in-stock / out-of-stock counts for the current category â€” cheap
  // (limit=1, only the `total` field is used) and keeps the sidebar counts
  // accurate without pulling the whole catalog client-side.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const base: Record<string, string> = { status: "active" };
        if (selectedCategory) base.category = selectedCategory;
        if (stitching) base.stitching = stitching;

        const [inRes, outRes] = await Promise.all([
          api.get("/universalFilter", {
            params: { ...base, stock: "true", limit: 1 },
          }),
          api.get("/universalFilter", {
            params: { ...base, stock: "false", limit: 1 },
          }),
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
  }, [selectedCategory, stitching]);

  // Main product fetch â€” server-side filtering/pagination.
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
        if (stitching) params.stitching = stitching;
        if (appliedSearch) params.title = appliedSearch;
        if (inStock !== outOfStock) params.stock = inStock ? "true" : "false";
        if (priceRange.min > PRICE_MIN) params.minPrice = priceRange.min;
        if (priceRange.max < PRICE_MAX) params.maxPrice = priceRange.max;
        if (
          sort === "newest" ||
          sort === "price-asc" ||
          sort === "price-desc"
        ) {
          params.sort = sort;
        }

        const cacheKey = `shop-products:v2:${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()}`;
        const data = await getCachedProductResponse(
          cacheKey,
          async () => (await api.get("/universalFilter", { params })).data,
        );
        if (cancelled) return;

        const list: ShopProduct[] = data?.data ?? [];
        setProducts(list);
        warmProductImages(list);
        setTotal(data?.total ?? 0);
        setTotalPages(data?.totalPages ?? 1);
        if (list.length > 0) {
          gaViewItemList({
            listName: selectedCategory
              ? CATEGORY_LABELS[selectedCategory]
              : "Shop",
            items: list.map((p) => ({
              item_id: p._id,
              item_name: p.title,
              item_category: p.category?.[0],
              price: p.price,
            })),
          });
        }
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
  }, [
    selectedCategory,
    stitching,
    appliedSearch,
    inStock,
    outOfStock,
    sort,
    currentPage,
    priceRange.min,
    priceRange.max,
  ]);

  const pageTitle = selectedCategory
    ? CATEGORY_LABELS[selectedCategory] ?? selectedCategory
    : "Shop All";

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
    setStitching("");
    setSearchQuery("");
    setAppliedSearch("");
    setSort("");
    setCurrentPage(1);
    setPriceRange({ min: PRICE_MIN, max: PRICE_MAX });
  };

  const renderFilterOptions = (variant: "sidebar" | "modal") => (
    <>
      {/* Availability */}
      <div
        className={`shop-page__sidebar-section${
          variant === "sidebar" ? " shop-page__sidebar-section--filter" : ""
        }`}
      >
        <button
          type="button"
          className="shop-page__sidebar-title-row"
          onClick={() => toggleSection("availability")}
        >
          <h3 className="shop-page__sidebar-title">Availability</h3>
          <span className="shop-page__sidebar-toggle">
            {openSections.availability ? "âˆ’" : "+"}
          </span>
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

      {/* Stitching */}
      {!selectedCategory && (
        <div
          className={`shop-page__sidebar-section${
            variant === "sidebar" ? " shop-page__sidebar-section--filter" : ""
          }`}
        >
          <button
            type="button"
            className="shop-page__sidebar-title-row"
            onClick={() => toggleSection("stitching")}
          >
            <h3 className="shop-page__sidebar-title">Stitching</h3>
            <span className="shop-page__sidebar-toggle">
              {openSections.stitching ? "âˆ’" : "+"}
            </span>
          </button>
          {openSections.stitching && (
            <div className="shop-page__sidebar-section-body">
              <label className="shop-page__checkbox-label">
                <input
                  type="radio"
                  name={`stitching-${variant}`}
                  checked={stitching === "stitched"}
                  onChange={() => { setStitching("stitched"); setCurrentPage(1); }}
                />
                <span>Stitched</span>
              </label>
              <label className="shop-page__checkbox-label">
                <input
                  type="radio"
                  name={`stitching-${variant}`}
                  checked={stitching === "unstitched"}
                  onChange={() => { setStitching("unstitched"); setCurrentPage(1); }}
                />
                <span>Unstitched</span>
              </label>
              {stitching && (
                <button
                  type="button"
                  className="shop-page__stitching-clear"
                  onClick={() => { setStitching(""); setCurrentPage(1); }}
                >
                  Show both
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Price */}
      <div
        className={`shop-page__sidebar-section${
          variant === "sidebar" ? " shop-page__sidebar-section--filter" : ""
        }`}
      >
        <button
          type="button"
          className="shop-page__sidebar-title-row"
          onClick={() => toggleSection("price")}
        >
          <h3 className="shop-page__sidebar-title">Price</h3>
          <span className="shop-page__sidebar-toggle">
            {openSections.price ? "âˆ’" : "+"}
          </span>
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
                  setPriceRange((prev) => ({
                    ...prev,
                    min: Math.max(PRICE_MIN, Math.min(Number(e.target.value), prev.max)),
                  }));
                  setCurrentPage(1);
                }}
              />
              <span className="shop-page__price-dash">â€”</span>
              <input
                type="number"
                className="shop-page__price-input"
                value={priceRange.max}
                min={priceRange.min}
                max={PRICE_MAX}
                onChange={(e) => {
                  setPriceRange((prev) => ({
                    ...prev,
                    max: Math.min(PRICE_MAX, Math.max(Number(e.target.value), prev.min)),
                  }));
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
              Price:{" "}
              <span className="shop-page__price-label-val">
                Rs.{priceRange.min.toLocaleString()}
              </span>
              {" â€” "}
              <span className="shop-page__price-label-val">
                Rs.{priceRange.max.toLocaleString()}
              </span>
            </p>
          </div>
        )}
      </div>
    </>
  );

  const submitSearch = () => {
    setAppliedSearch(searchQuery.trim());
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <main className="shop-loading-screen" role="status" aria-live="polite">
        <div className="rlo-stack">
          <p className="rlo-eyebrow">Zarya Style</p>
          <LoadingRing active />
          <p className="rlo-text">Fetching the collection</p>
        </div>
      </main>
    );
  }

  return (
    <div className="shop-page">
      <NavbarController />

      {/* Header */}
      <div className="shop-page__header">
        <p className="shop-page__header-breadcrumb">
          <Link href="/">Home</Link> / {pageTitle}
        </p>
        <h1 className="shop-page__title">{pageTitle}</h1>
        <div className="shop-page__search" ref={searchRef}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            placeholder="Search products..."
            aria-label="Search products"
            autoComplete="off"
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              if (event.target.value.trim().length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitSearch();
              if (event.key === "Escape") setShowSuggestions(false);
            }}
          />
          <button type="button" onClick={submitSearch}>Search</button>
          {showSuggestions && (
            <div className="shop-page__suggestions" role="listbox">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  key={suggestion._id}
                  onClick={() => router.push(`/shop/${suggestion.slug ?? suggestion._id}`)}
                >
                  <Search size={14} aria-hidden="true" />
                  <span>{suggestion.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="shop-page__delivery-note">
          Rs 140 standard shipping across Pakistan Â· Delivered in 4â€“6 days
        </p>
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
              Ã—
            </button>
          </div>
          <div className="shop-filter-modal-body">
            {renderFilterOptions("modal")}
          </div>
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
              <div className="shop-page__sort-wrap">
                <span className="shop-page__sort-label">Sort by:</span>
                <select
                  className="shop-page__sort-select"
                  value={sort}
                  onChange={handleSortChange}
                >
                  <option value="">Best Selling</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="shop-page-grid-container">
            {products.length === 0 ? (
              <div className="shop-page__empty">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#b0b0b0"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <h2 className="shop-page__empty-title">No products found</h2>
                <p className="shop-page__empty-sub">
                  Try adjusting your filters to find what you&apos;re looking
                  for.
                </p>
                <button
                  className="shop-page__empty-reset"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="shop-page__grid">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product as unknown as GridProduct}
                    listName={pageTitle}
                  />
                ))}
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

                {getPaginationRange(currentPage, totalPages).map(
                  (item, index) =>
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
                    ),
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

export default function ShopPageClient() {
  return (
    <Suspense fallback={null}>
      <ShopPageContent />
    </Suspense>
  );
}

