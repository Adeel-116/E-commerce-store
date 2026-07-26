"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../styles/ProductInner.css";
import "../../styles/ProductGrid.css";
import NavbarController from "@/app/components/NavbarController";
import api from "@/app/lib/axios";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { Shirt, ShieldCheck, Lock, Truck } from "lucide-react";
import { isRealColor } from "@/app/hooks/useProductCardImages";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/app/lib/shipping";

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
  price: number;
  comparePrice: number | null;
  category: string[];
  sizes: string[];
  colors: ColorVariant[];
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

function getDiscountPercent(product: Product): number | null {
  return product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;
}

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const { addToCart, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);
      setProduct(null);
      setActiveImage(0);
      setQuantity(1);
      setSelectedSize(null);
      setSelectedColor(null);
      setDescriptionExpanded(false);

      try {
        const { data } = await api.get("/getProductById", { params: { slug } });
        if (cancelled) return;

        if (data?.success && data.data) {
          setProduct(data.data);
        } else {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get("/universalFilter", {
          params: { status: "active", limit: 5 },
        });
        if (cancelled) return;
        const list: Product[] = (data?.data ?? [])
          .filter((p: Product) => p._id !== product._id)
          .slice(0, 4);
        setSimilarProducts(list);
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
        <div className="shop-inner-status">Loading…</div>
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
  const wishlisted = isWishlisted(product._id);
  const allColors = product.colors ?? [];
  // Only variations with a real name get a swatch and a "select a color"
  // requirement — a lone unnamed group is just extra photos.
  const productColors = allColors.filter(isRealColor);
  const hasSizes = product.sizes.length > 0;
  const hasColors = productColors.length > 0;
  const canAddToCart =
    product.stock && (!hasSizes || !!selectedSize) && (!hasColors || !!selectedColor);

  // Default view is the first variation's photos (falling back to the
  // product's own images); picking a color switches to that color's photos.
  const defaultImages = allColors[0]?.images?.length ? allColors[0].images : product.images;
  const selectedVariant = selectedColor
    ? productColors.find((c) => c.name === selectedColor)
    : undefined;
  const galleryImages =
    selectedVariant && selectedVariant.images.length > 0
      ? selectedVariant.images
      : defaultImages;

  const handleSelectColor = (colorName: string) => {
    setSelectedColor((prev) => (prev === colorName ? null : colorName));
    setActiveImage(0);
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart({
      id: product._id,
      productName: product.title,
      brand: "",
      price: product.price,
      size: selectedSize ?? "",
      color: selectedColor,
      quantity,
      productImage: galleryImages[0] ?? product.images[0],
    });
    openCart();
  };

  return (
    <div className="shop-inner-page">
      <NavbarController />

      <div className="shop-inner-page-container">
        <div className="shop-inner-container shop-inner-container--stretch">
          {/* Left: Image gallery */}
          <div className="shop-inner-product-image-col">
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
                  <strong>Free Delivery:</strong> On orders above Rs.{" "}
                  {FREE_SHIPPING_THRESHOLD.toLocaleString("en-PK")}. Otherwise Rs.{" "}
                  {SHIPPING_COST} standard shipping, delivered in 4–6 days.
                </p>
              </div>
            </div>

            <div className="shop-inner-gallery">
              {galleryImages.length > 1 && (
                <div className="shop-inner-gallery-thumbs">
                  {galleryImages.map((img, index) => (
                    <button
                      key={img}
                      type="button"
                      className={`shop-inner-gallery-thumb${activeImage === index ? " active" : ""}`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img src={img} alt={`${product.title} ${index + 1}`} title={`${product.title} ${index + 1}`} />
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
                />
              </div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="shop-inner-right-container shop-inner-right-centered">
            <h1 className="shop-inner-title">{product.title}</h1>

            <p
              className={`shop-inner-description ${descriptionExpanded ? "shop-inner-description--expanded" : ""}`}
            >
              {product.description}
            </p>
            {product.description && (
              <button
                type="button"
                className="shop-inner-description-toggle"
                onClick={() => setDescriptionExpanded((prev) => !prev)}
              >
                {descriptionExpanded ? "View less" : "View more"}
              </button>
            )}

            <hr className="section-divider" />

            {/* Price */}
            <div className="shop-inner-size-price">
              <div className="price-box-container">
                <span className="price-current">
                  Rs.{(product.price * quantity).toLocaleString()}
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
                  <span className="shop-inner-size-label">Select Size</span>
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
                <p className="shop-inner-size-hint">No sizes available for this product.</p>
              )}
            </div>

            {/* Qty + Cart */}
            <div className="qty-block" style={{ marginTop: "20px" }}>
              <button
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity((q) => q + 1)}>
                +
              </button>

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
                  : "Add to Cart"}
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </button>

              <Link href="/checkout" className="checkout-btn">
                Checkout
              </Link>
            </div>

            <hr className="section-divider" style={{ marginTop: "24px" }} />

            <div className="trust-badges">
              <div className="trust-item">
                <div className="trust-icon">
                  <Shirt />
                </div>
                <div className="trust-text">
                  <strong>Premium Fabric Quality</strong>
                  <span>Comfortable everyday wear</span>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <ShieldCheck />
                </div>
                <div className="trust-text">
                  <strong>Authenticity Guarantee</strong>
                  <span>On all the products</span>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <Lock />
                </div>
                <div className="trust-text">
                  <strong>Safe and Secure Checkout</strong>
                  <span>Ensures data protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        {similarProducts.length > 0 && (
          <div className="similar-products-section">
            <h2 id="similar-text">You May Also Like</h2>
            <div className="cg-grid similar-products-grid">
              {similarProducts.map((item) => {
                const itemImage = item.colors?.[0]?.images?.length
                  ? item.colors[0].images[0]
                  : item.images[0];
                const itemVisibleColors = (item.colors ?? []).filter(isRealColor);
                const itemWishlisted = isWishlisted(item._id);
                return (
                  <Link href={`/shop/${item.slug}`} key={item._id} className="cg-card">
                    <div className="cg-card-image-container">
                      <img
                        src={itemImage}
                        alt={item.title}
                        title={item.title}
                        className="cg-card-image"
                      />
                      <button
                        type="button"
                        className={`cg-card-wishlist-float${itemWishlisted ? " active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist({
                            id: item._id,
                            name: item.title,
                            description: item.description,
                            image: itemImage,
                            stock: item.stock,
                            price: item.price,
                            sizes: item.sizes,
                          });
                        }}
                        aria-label={itemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={itemWishlisted ? "#1c1c1c" : "none"}
                          stroke={itemWishlisted ? "#1c1c1c" : "currentColor"}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="cg-card-bottom-section">
                      <h3 className="cg-card-heading">{item.title}</h3>
                      {itemVisibleColors.length > 0 && (
                        <div className="cg-card-color-swatches">
                          {itemVisibleColors.slice(0, 5).map((color) => (
                            <span
                              key={color.name}
                              className="cg-card-color-dot"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                          {itemVisibleColors.length > 5 && (
                            <span className="cg-card-color-more">+{itemVisibleColors.length - 5}</span>
                          )}
                        </div>
                      )}
                      <div className="cg-card-price-row">
                        <span className="cg-card-price">
                          Rs.{item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
