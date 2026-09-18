"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../../styles/ProductInner.css";
import "../../styles/ProductInnerButtons.css";
import "../../styles/ProductGrid.css";
import NavbarController from "@/app/components/NavbarController";
import { ProductDetailSkeleton } from "@/app/components/Skeleton";
import api from "@/app/lib/axios";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import {
  Truck,
  ShoppingCart,
  PackageCheck,
  BadgeCheck,
  Award,
  Sparkles,
  ZoomIn,
  Flame,
  Eye,
  ShieldCheck,
  Plus,
  Minus,
  X,
} from "lucide-react";
import ProductZoomModal from "@/app/components/ProductZoomModal";
import {
  isRealColor,
  DEFAULT_VARIANT_NAME,
} from "@/app/hooks/useProductCardImages";
import { gaViewItem } from "@/app/lib/gaEvents";
import { metaViewContent } from "@/app/lib/metaEvents";
import { ProductCard, type GridProduct } from "@/app/components/ProductGrid";
import SizeGuideContent, { type MeasurementChart } from "@/app/components/SizeGuideContent";

type ColorVariant = {
  name: string;
  hex: string;
  images: string[];
};

type Product = {
  _id: string;
  productId: number;
  title: string;
  slug: string;
  description: string;
  images: string[];
  measurementImage?: string;
  measurementCharts?: MeasurementChart[];
  price: number;
  sizePrices?: Record<string, number>;
  comparePrice: number | null;
  category: string[];
  sizes: string[];
  colors: ColorVariant[];
  isNew: boolean;
  stock: boolean;
  status: "active" | "inactive";
  isStitched?: boolean;
  isUnstitched?: boolean;
  stitchedPrice?: number | null;
  activeDiscount: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  } | null;
};

function getDiscountPercent(product: Product): number | null {
  return product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;
}

// Deterministic per-product "social proof" numbers â€” derived from the
// product id so they're stable across server/client render (no hydration
// mismatch) and don't reshuffle on every re-render, but still vary product
// to product instead of showing one hardcoded number everywhere.
function seededRange(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return min + (hash % (max - min + 1));
}

export default function ProductDetailClient({
  slug,
  initialProduct,
}: {
  slug: string;
  initialProduct?: Product | null;
}) {
  const [product, setProduct] = useState<Product | null>(
    initialProduct ?? null,
  );
  const [loading, setLoading] = useState(!initialProduct);
  const [notFound, setNotFound] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    initialProduct?.sizes?.[0] ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialProduct?.colors?.find(isRealColor)?.name ?? null,
  );

  const hasStitchingOptions = !!(
    initialProduct?.isStitched && initialProduct?.isUnstitched
  );
  const [selectedStitching, setSelectedStitching] = useState<
    "stitched" | "unstitched" | null
  >(
    hasStitchingOptions
      ? "unstitched"
      : initialProduct?.isStitched
        ? "stitched"
        : initialProduct?.isUnstitched
          ? "unstitched"
          : null,
  );
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    if (!sizeGuideOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSizeGuideOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [sizeGuideOpen]);
  const [openAccordion, setOpenAccordion] = useState<string | null>(
    "description",
  );
  const { addToCart, openCart, closeCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const router = useRouter();

  // Illustrative shipping timeline dates, computed from "today" â€” set only
  // after mount (not during render) so the server-rendered markup and the
  // client's first render match; the page is served/cached at different
  // moments than any one visitor's "today", so computing this during render
  // would produce a hydration mismatch on any day boundary.
  const [timelineDates, setTimelineDates] = useState<{
    ordered: string;
    shipped: string;
    delivered: string;
  } | null>(null);
  useEffect(() => {
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const addDays = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d;
    };
    setTimelineDates({
      ordered: fmt(addDays(0)),
      shipped: fmt(addDays(2)),
      delivered: `${fmt(addDays(5))} â†’ ${fmt(addDays(8))}`,
    });
  }, []);

  // The server already fetched this product for metadata/SEO â€” reuse it for
  // the first render instead of re-fetching client-side, which used to leave
  // the page on a skeleton for an extra full round-trip on every visit.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!initialProduct) {
        setLoading(true);
        setNotFound(false);
        setProduct(null);
        setActiveImage(0);
        setQuantity(1);
        setSelectedSize(null);
        setSelectedColor(null);
      }

      try {
        const { data } = await api.get("/getProductById", { params: { slug } });
        if (cancelled) return;

        if (data?.success && data.data) {
          const fetchedProduct: Product = data.data;
          setProduct(fetchedProduct);
          const firstRealColor = (fetchedProduct.colors ?? []).find(
            isRealColor,
          );
          setSelectedColor(firstRealColor?.name ?? null);
          setSelectedSize(fetchedProduct.sizes?.[0] ?? null);
          const hasStitchingOpts = !!(
            fetchedProduct.isStitched && fetchedProduct.isUnstitched
          );
          setSelectedStitching(
            hasStitchingOpts
              ? "unstitched"
              : fetchedProduct.isStitched
                ? "stitched"
                : fetchedProduct.isUnstitched
                  ? "unstitched"
                  : null,
          );
        } else if (!initialProduct) {
          setNotFound(true);
        }
      } catch {
        if (!cancelled && !initialProduct) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    gaViewItem({
      item_id: product._id,
      item_name: product.title,
      item_category: product.category?.[0],
      price: product.price,
      value: product.price,
    });
    metaViewContent({
      item_id: product._id,
      item_name: product.title,
      item_category: product.category?.[0],
      price: product.price,
      value: product.price,
    });
  }, [product]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;

    setSimilarProducts([]);
    (async () => {
      try {
        const isKidsCollection = product.category?.includes("kids-collection");
        const { data } = isKidsCollection
          ? await api.get("/universalFilter", {
              params: { category: "kids-collection", status: "active", limit: 5 },
            })
          : await api.get("/getSimilarProducts", {
              params: { excludeId: product._id, limit: 4 },
            });
        if (cancelled) return;
        const recommendations: Product[] = data?.data ?? [];
        setSimilarProducts(
          isKidsCollection
            ? recommendations.filter((item) => item._id !== product._id).slice(0, 4)
            : recommendations,
        );
      } catch {
        if (!cancelled) setSimilarProducts([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product]);

  if (loading) {
    return (
      <div className="shop-inner-page">
        <NavbarController />
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="shop-inner-page">
        <NavbarController />
        <div className="shop-inner-status">Product not found.</div>
      </div>
    );
  }

  const discountPercent = getDiscountPercent(product);
  const soldCount = seededRange(product._id, 8, 46);
  const viewingCount = seededRange(product._id + "v", 6, 28);
  const wishlisted = isWishlisted(product._id);
  const isWesternFashion = product.category?.includes("western") ?? false;
  const allColors = product.colors ?? [];
  // Only variations with a real name get a swatch and a "select a color"
  // requirement â€” a lone unnamed group is just extra photos.
  const productColors = isWesternFashion ? [] : allColors.filter(isRealColor);
  const hasSizes = product.sizes.length > 0;
  const hasColors = productColors.length > 0;
  const canAddToCart =
    product.stock &&
    (!hasSizes || !!selectedSize) &&
    (!hasColors || !!selectedColor) &&
    (isWesternFashion || !(product.isStitched && product.isUnstitched) || !!selectedStitching);

  const currentPrice =
    product.sizePrices?.[selectedSize ?? ""] ?? (
    !isWesternFashion && selectedStitching === "stitched" &&
    typeof product.stitchedPrice === "number"
      ? product.stitchedPrice
      : product.price);

  // Default view is the first variation's photos (falling back to the
  // product's own images); picking a color switches to that color's photos.
  const defaultImages = allColors[0]?.images?.length
    ? allColors[0].images
    : product.images;
  const selectedVariant = selectedColor
    ? productColors.find((c) => c.name === selectedColor)
    : undefined;
  const galleryImages =
    selectedVariant && selectedVariant.images.length > 0
      ? selectedVariant.images
      : defaultImages;

  // Thumbnail strip shows every color variation's photos together (not just
  // the active color's) so shoppers can preview any color without switching
  // first â€” clicking a thumbnail from another color jumps both the main
  // image and the color selection to match.
  const thumbSource =
    allColors.length > 0
      ? allColors
      : [{ name: "", hex: "", images: product.images }];
  const allThumbs = thumbSource.flatMap((c) =>
    c.images.map((img) => ({ url: img, colorName: c.name })),
  );
  const activeImageUrl = galleryImages[activeImage] ?? galleryImages[0];

  const handleSelectColor = (colorName: string) => {
    setSelectedColor((prev) => (prev === colorName ? null : colorName));
    setActiveImage(0);
  };

  const handleSelectThumb = (thumb: { url: string; colorName: string }) => {
    const isRealVariant =
      thumb.colorName && thumb.colorName !== DEFAULT_VARIANT_NAME;
    if (isRealVariant && thumb.colorName !== selectedColor) {
      setSelectedColor(thumb.colorName);
    }
    const variantImages = isRealVariant
      ? (productColors.find((c) => c.name === thumb.colorName)?.images ??
        defaultImages)
      : defaultImages;
    const idx = variantImages.indexOf(thumb.url);
    setActiveImage(idx >= 0 ? idx : 0);
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart({
      id: product._id,
      productName: product.title,
      brand: "",
      price: currentPrice,
      size: selectedSize ?? "",
      color: selectedColor,
      stitching: selectedStitching,
      quantity,
      productImage: galleryImages[0] ?? product.images[0],
    });
    openCart();
  };

  // "Quick Checkout" used to be a plain link straight to /checkout â€” if this
  // product was never added to the cart first, checkout would load with an
  // empty cart (subtotal/total showing 0). It needs to add the item first,
  // same as the Add to Cart button, then navigate â€” just without popping the
  // cart sidebar open, since we're leaving the page anyway.
  const handleQuickCheckout = () => {
    if (!canAddToCart) return;
    addToCart({
      id: product._id,
      productName: product.title,
      brand: "",
      price: currentPrice,
      size: selectedSize ?? "",
      color: selectedColor,
      stitching: selectedStitching,
      quantity,
      productImage: galleryImages[0] ?? product.images[0],
    });
    closeCart();
    router.push("/checkout");
  };

  const handleWhatsAppOrder = () => {
    if (!canAddToCart) return;

    const details = [
      "Hi Zarya Style! I would like to order this product:",
      "",
      `Product: ${product.title}`,
      `Price: Rs. ${(currentPrice * quantity).toLocaleString()}`,
      selectedSize ? `Size: ${selectedSize}` : null,
      selectedColor ? `Color: ${selectedColor}` : null,
      selectedStitching ? `Type: ${selectedStitching}` : null,
      `Quantity: ${quantity}`,
      `Link: ${window.location.href}`,
    ].filter(Boolean);

    window.open(
      `https://wa.me/923483935003?text=${encodeURIComponent(details.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="shop-inner-page">
      <NavbarController />

      <div className="shop-inner-top-bar">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">|</span>
          <Link href="/shop">Shop</Link>
          <span className="sep">|</span>
          <span>{product.title}</span>
        </nav>

        <div className="shop-inner-bundle-banner">
          <div className="shop-inner-bundle-banner-icon">
            <Truck size={16} />
          </div>
          <div className="shop-inner-bundle-banner-text">
            <p>
              <strong>Rs 140 Delivery</strong> on all orders, delivered in 5â€“8
              days.
            </p>
          </div>
        </div>
      </div>

      <div className="shop-inner-page-container">
        <div className="shop-inner-container shop-inner-container--stretch">
          {/* Left: Image gallery */}
          <div className="shop-inner-product-image-col">
            <div className="shop-inner-gallery">
              {allThumbs.length > 1 && (
                <div className="shop-inner-gallery-thumbs">
                  {allThumbs.map((thumb, index) => (
                    <button
                      key={`${thumb.colorName}-${thumb.url}-${index}`}
                      type="button"
                      className={`shop-inner-gallery-thumb${activeImageUrl === thumb.url ? " active" : ""}`}
                      onClick={() => handleSelectThumb(thumb)}
                    >
                      <img
                        src={thumb.url}
                        alt={`${product.title} ${index + 1}`}
                        title={`${product.title} ${index + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="shop-inner-fixed-image-wrap">
                {discountPercent !== null && (
                  <div className="shop-inner-discount-ribbon">
                    <span className="shop-inner-discount-tag">
                      -{discountPercent}%
                    </span>
                  </div>
                )}
                <button
                  className={`shop-inner-wishlist-btn ${wishlisted ? "active" : ""}`}
                  onClick={() =>
                    toggleWishlist({
                      id: product._id,
                      name: product.title,
                      description: product.description,
                      image: defaultImages[0] ?? product.images[0],
                      stock: product.stock,
                      price: product.price,
                      sizes: product.sizes,
                    })
                  }
                  aria-label="Add to wishlist"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                      2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09
                      3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
                      3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      fill={wishlisted ? "#1c1c1c" : "none"}
                      stroke={wishlisted ? "#1c1c1c" : "#5a5a5a"}
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>

                <img
                  src={galleryImages[activeImage] ?? galleryImages[0]}
                  alt={product.title}
                  title={product.title}
                  className="shop-inner-static-img"
                  onClick={() => setZoomOpen(true)}
                />

                <button
                  type="button"
                  className="shop-inner-zoom-btn"
                  onClick={() => setZoomOpen(true)}
                  aria-label="Zoom image"
                  title="Zoom image"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>
          </div>

          {zoomOpen && (
            <ProductZoomModal
              images={allThumbs.map((t) => t.url)}
              initialIndex={Math.max(
                0,
                allThumbs.findIndex((t) => t.url === activeImageUrl),
              )}
              productTitle={product.title}
              onClose={() => setZoomOpen(false)}
            />
          )}

          {sizeGuideOpen && (product.measurementImage || product.measurementCharts?.length) && (
            <div className="size-guide-modal" role="dialog" aria-modal="true" aria-label={`${product.title} size guide`} onClick={() => setSizeGuideOpen(false)}>
              <div className="size-guide-modal__panel" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="size-guide-modal__close" onClick={() => setSizeGuideOpen(false)} aria-label="Close size guide"><X size={24} /></button>
                <SizeGuideContent title={product.title} image={product.measurementImage} charts={product.measurementCharts} />
              </div>
            </div>
          )}
          {/* Right: Product Details */}
          <div className="shop-inner-right-container shop-inner-right-centered">
            <h1 className="shop-inner-title">{product.title}</h1>

            <div className="shop-inner-urgency-row">
              <Flame size={15} className="shop-inner-urgency-icon" />
              <span>
                <strong>{soldCount}</strong> sold in last 24 hours
              </span>
            </div>

            <hr className="section-divider" />

            {/* Price */}
            <div className="shop-inner-size-price">
              <div className="price-box-container">
                <span className="price-current">
                  Rs.{(currentPrice * quantity).toLocaleString()}
                </span>
                {product.comparePrice && (
                  <span className="price-original">
                    Rs.{" "}
                    <span className="price-original-value">
                      {(product.comparePrice * quantity).toLocaleString()}
                    </span>
                  </span>
                )}
                {discountPercent !== null && (
                  <span className="discount-label">-{discountPercent}%</span>
                )}
              </div>

              <div className="shop-inner-viewers-row">
                <Eye size={14} />
                <span>
                  <strong>{viewingCount}</strong> people are viewing this right
                  now
                </span>
              </div>

              {/* Stitching selector */}
              {!isWesternFashion && (product.isStitched || product.isUnstitched) && (
                <div className="shop-inner-size-selector shop-inner-type-selector">
                  <span
                    className="shop-inner-size-label"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {product.isStitched && product.isUnstitched
                      ? "Stitching Type"
                      : "Type"}
                    {product.isStitched &&
                      product.isUnstitched &&
                      selectedStitching !== "stitched" && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--brandgreen)",
                            textTransform: "none",
                            fontWeight: 600,
                            padding: "2px 6px",
                            background: "rgba(34,139,34, 0.1)",
                            borderRadius: "4px",
                          }}
                        >
                          âœ¨ Want to buy stitched? Click here!
                        </span>
                      )}
                  </span>
                  {product.isStitched && product.isUnstitched ? (
                    <div className="shop-inner-size-options">
                      <button
                        type="button"
                        className={`shop-inner-size-pill${selectedStitching === "unstitched" ? " active" : ""}`}
                        onClick={() => setSelectedStitching("unstitched")}
                      >
                        Unstitched
                      </button>
                      <button
                        type="button"
                        className={`shop-inner-size-pill${selectedStitching === "stitched" ? " active" : ""}`}
                        onClick={() => setSelectedStitching("stitched")}
                      >
                        Stitched
                      </button>
                    </div>
                  ) : (
                    <div className="shop-inner-size-options">
                      <span
                        className="shop-inner-size-pill active"
                        style={{ cursor: "default" }}
                      >
                        {product.isStitched ? "Stitched" : "Unstitched"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Color selector */}
              {hasColors && (
                <div className="shop-inner-size-selector">
                  <span className="shop-inner-size-label">
                    Select Color{selectedColor ? `: ${selectedColor}` : ""}
                  </span>
                  <div className="shop-inner-color-options">
                    {productColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        className={`shop-inner-color-swatch${selectedColor === color.name ? " active" : ""}`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => handleSelectColor(color.name)}
                        aria-label={color.name}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {hasSizes ? (
                <div className="shop-inner-size-selector">
                  <div className="shop-inner-size-heading">
                    <span className="shop-inner-size-label">Select Size</span>
                    {(product.measurementImage || product.measurementCharts?.length) && (
                      <button type="button" className="shop-inner-size-guide-btn" onClick={() => setSizeGuideOpen(true)}>Size Guide</button>
                    )}
                  </div>
                  <div className="shop-inner-size-options">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`shop-inner-size-pill${selectedSize === size ? " active" : ""}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="shop-inner-size-hint">
                  No sizes available for this product.
                </p>
              )}
            </div>

            {/* Info box: delivery estimate, promo hint, standard shipping */}
            <div className="shop-inner-info-box">
              <div className="shop-inner-info-row">
                <Truck size={17} />
                <span>
                  Estimated delivery time: <strong>5â€“8 days</strong>
                </span>
              </div>
              <div className="shop-inner-info-divider" />
              <div className="shop-inner-info-row">
                <Sparkles size={17} />
                <span>
                  Use code <strong>&quot;STYLE20&quot;</strong> for an extra 20%
                  off
                </span>
              </div>
              <div className="shop-inner-info-divider" />
              <div className="shop-inner-info-row">
                <PackageCheck size={17} />
                <span>Standard shipping &amp; easy returns</span>
              </div>
            </div>

            {/* Qty + Cart */}
            <div className="qty-block">
              <div className="shop-inner-qty-control">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                className="add-to-cart-btn"
                disabled={!canAddToCart}
                onClick={handleAddToCart}
              >
                {!product.stock
                  ? "Sold Out"
                  : hasSizes && !selectedSize
                    ? "Select a Size"
                    : hasColors && !selectedColor
                      ? "Select a Color"
                      : "Add To Cart"}
              </button>
            </div>

            <button
              type="button"
              className="checkout-btn checkout-btn--primary"
              disabled={!canAddToCart}
              onClick={handleQuickCheckout}
            >
              Buy It Now
            </button>

            <button
              type="button"
              className="shop-inner-whatsapp-order"
              disabled={!canAddToCart}
              onClick={handleWhatsAppOrder}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm0 18.12h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.34c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.2-8.24 8.2zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.13.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
              </svg>
              Order on WhatsApp
            </button>

            <div className="shop-inner-guarantee">
              <ShieldCheck size={16} />
              <span>Guaranteed Safe Checkout</span>
            </div>

            {/* Illustrative shipping timeline â€” not tied to a real order, just
                sets delivery-speed expectations before purchase. */}
            <div className="order-timeline">
              <div className="order-timeline-step">
                <div className="order-timeline-icon order-timeline-icon-ordered">
                  <ShoppingCart />
                </div>
                <strong>Ordered</strong>
                <span>{timelineDates?.ordered ?? "Today"}</span>
              </div>
              <div className="order-timeline-line" />
              <div className="order-timeline-step">
                <div className="order-timeline-icon order-timeline-icon-shipped">
                  <Truck />
                </div>
                <strong>Shipped</strong>
                <span>{timelineDates?.shipped ?? "Within 1â€“2 days"}</span>
              </div>
              <div className="order-timeline-line" />
              <div className="order-timeline-step">
                <div className="order-timeline-icon order-timeline-icon-delivered">
                  <PackageCheck />
                </div>
                <strong>Delivered</strong>
                <span>{timelineDates?.delivered ?? "In 5â€“8 days"}</span>
              </div>
            </div>

            <div className="perks-row">
              <div className="perks-item">
                <div className="perks-icon perks-icon-replacement">
                  <BadgeCheck />
                </div>
                <span>7 Days Replacement Policy</span>
              </div>
              <div className="perks-item">
                <div className="perks-icon perks-icon-quality">
                  <Award />
                </div>
                <span>Finest Quality &amp; Meticulous Stitching</span>
              </div>
              <div className="perks-item">
                <div className="perks-icon perks-icon-unique">
                  <Sparkles />
                </div>
                <span>One-of-a-Kind Unique Designs</span>
              </div>
            </div>

            {/* Accordion: Description / Shipping & Returns / Return Policies */}
            <div className="accordion-section">
              <div
                className={`accordion-item${openAccordion === "description" ? " active" : ""}`}
              >
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() =>
                    setOpenAccordion((prev) =>
                      prev === "description" ? null : "description",
                    )
                  }
                >
                  <span>Description</span>
                  <Plus size={16} className="accordion-icon" />
                </button>
                <div className="accordion-content">
                  <div className="accordion-inner">
                    <p>
                      {product.description ||
                        "No description available for this product."}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`accordion-item${openAccordion === "shipping" ? " active" : ""}`}
              >
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() =>
                    setOpenAccordion((prev) =>
                      prev === "shipping" ? null : "shipping",
                    )
                  }
                >
                  <span>Shipping and Returns</span>
                  <Plus size={16} className="accordion-icon" />
                </button>
                <div className="accordion-content">
                  <div className="accordion-inner">
                    <ul>
                      <li>Orders are dispatched within 1â€“2 business days.</li>
                      <li>Estimated delivery time is 5â€“8 business days.</li>
                      <li>
                        Rs 140 standard shipping on all orders, nationwide.
                      </li>
                      <li>Easy returns within 7 days of delivery.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div
                className={`accordion-item${openAccordion === "returns" ? " active" : ""}`}
              >
                <button
                  type="button"
                  className="accordion-header"
                  onClick={() =>
                    setOpenAccordion((prev) =>
                      prev === "returns" ? null : "returns",
                    )
                  }
                >
                  <span>Return Policies</span>
                  <Plus size={16} className="accordion-icon" />
                </button>
                <div className="accordion-content">
                  <div className="accordion-inner">
                    <p>
                      If you&apos;re not fully satisfied, items can be returned
                      within 7 days of delivery in original condition with tags
                      attached. Refunds are processed to your original payment
                      method once the return is received and inspected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* People Also Bought */}
        {similarProducts.length > 0 && (
          <div className="similar-products-section">
            <div className="similar-products-heading">
              <h2 id="similar-text">People Also Bought</h2>
              <p>
                Here&apos;s some of our most similar products people are buying.
                Click to discover trending style.
              </p>
            </div>
            <div className="cg-grid similar-products-grid">
              {similarProducts.map((item) => (
                <ProductCard
                  key={item._id}
                  product={item as unknown as GridProduct}
                  listName="People Also Bought"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
