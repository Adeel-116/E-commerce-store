"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "../styles/ProductGrid.css";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import api from "../lib/axios";
import { ProductGridSkeleton } from "./Skeleton";
import ProductImageSwiper from "./ProductImageSwiper";
import {
  useProductCardImages,
  isRealColor,
} from "../hooks/useProductCardImages";
import { gaSelectItem, gaViewItemList } from "../lib/gaEvents";

type ColorVariant = {
  name: string;
  hex: string;
  images: string[];
};

export type GridProduct = {
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
  isBestSeller: boolean;
  stock: boolean;
  status: "active" | "inactive";
  activeDiscount: {
    discountId: string;
    name: string;
    valueType: "percentage" | "fixed";
    value: number;
  } | null;
};

export function ProductCard({
  product,
  listName,
}: {
  product: GridProduct;
  listName?: string;
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart, openCart } = useCart();
  const {
    displayImages,
    activeColorName,
    previewColor,
    activeImageIndex,
    onIndexChange,
  } = useProductCardImages(product.images, product.colors ?? []);

  const wishlisted = isWishlisted(product._id);
  const firstSize = product.sizes?.[0];
  const visibleColors = (product.colors ?? []).filter(isRealColor);
  const firstColor = visibleColors[0]?.name ?? null;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product._id,
      name: product.title,
      image: displayImages[0] ?? product.images[0],
      stock: product.stock,
      price: product.price,
      sizes: product.sizes,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstSize || !product.stock) return;
    addToCart({
      id: product._id,
      productName: product.title,
      brand: "",
      price: product.price,
      size: firstSize,
      color: firstColor,
      productImage: displayImages[0] ?? product.images[0],
    });
    openCart();
  };

  const handleCardClick = () => {
    gaSelectItem({
      item: {
        item_id: product._id,
        item_name: product.title,
        item_category: product.category?.[0],
        price: product.price,
      },
      listName,
    });
  };

  return (
    <Link
      href={`/shop/${product.slug}`}
      className={`cg-card${!product.stock ? " cg-card-outofstock" : ""}`}
      onClick={handleCardClick}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="cg-card-image-container">
        <ProductImageSwiper
          images={displayImages}
          alt={product.title}
          activeIndex={activeImageIndex}
          onIndexChange={onIndexChange}
        />

        <div className="cg-card-scrim" />

        <div className="cg-card-badges">
          {!product.stock ? (
            <span className="cg-badge cg-badge-outofstock">Out of Stock</span>
          ) : (
            <>
              {product.isNew && (
                <span className="cg-badge cg-badge-new">New Arrivals</span>
              )}
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="cg-badge cg-badge-discount">
                  -
                  {Math.round((1 - product.price / product.comparePrice) * 100)}
                  %
                </span>
              )}
            </>
          )}
        </div>

        <button
          className={`cg-card-wishlist-float${wishlisted ? " active" : ""}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={wishlisted ? "#1c1c1c" : "none"}
            stroke={wishlisted ? "#1c1c1c" : "currentColor"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <button
          className="cg-card-quick-add"
          onClick={handleAddToCart}
          disabled={!firstSize || !product.stock}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {product.stock && firstSize ? "Add to Cart" : "Unavailable"}
        </button>
      </div>

      <div className="cg-card-bottom-section">
        <h3 className="cg-card-heading">{product.title}</h3>
        <div className="cg-card-price-row">
          <span className="cg-card-price">
            Rs.{product.price.toLocaleString()}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="cg-card-price-original">
              Rs.{product.comparePrice.toLocaleString()}
            </span>
          )}
        </div>

        {visibleColors.length > 0 && (
          <div
            className="cg-card-color-swatches"
            onMouseLeave={() => previewColor(null)}
          >
            {visibleColors.slice(0, 5).map((color) => (
              <span
                key={color.name}
                className={`cg-card-color-dot${activeColorName === color.name ? " active" : ""}`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
                onMouseEnter={() => previewColor(color.name)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  previewColor(
                    activeColorName === color.name ? null : color.name,
                  );
                }}
              />
            ))}
            {visibleColors.length > 5 && (
              <span className="cg-card-color-more">
                +{visibleColors.length - 5}
              </span>
            )}
          </div>
        )}

        {product.sizes?.length > 0 && (
          <div className="cg-card-size-pills">
            {product.sizes.map((size) => (
              <span key={size} className="cg-card-size-pill">
                {size}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

const ProductGrid = ({
  title = "Best Sellers",
  limit = 8,
}: {
  title?: string;
  limit?: number;
}) => {
  const [products, setProducts] = useState<GridProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/universalFilter", {
          params: { status: "active", isBestSeller: "true", limit },
        });
        if (!cancelled) {
          const list: GridProduct[] = data?.data ?? [];
          setProducts(list);
          if (list.length > 0) {
            gaViewItemList({
              listName: title,
              items: list.map((p) => ({
                item_id: p._id,
                item_name: p.title,
                item_category: p.category?.[0],
                price: p.price,
              })),
            });
          }
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit, title]);

  return (
    <div className="cg-section">
      <div className="cg-section-header">
        <div className="cg-section-eyebrow">
          <span className="cg-section-eyebrow-line" />
          <p className="cg-section-tag">Shop The Look</p>
          <span className="cg-section-eyebrow-line" />
        </div>
        <h2 className="cg-section-title">{title}</h2>
        <p className="cg-section-subtitle">
          Handpicked favourites our customers keep coming back for.
        </p>
      </div>

      {loading ? (
        <ProductGridSkeleton count={limit} />
      ) : products.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "var(--muted)",
          }}
        >
          No products found.
        </p>
      ) : (
        <div className="cg-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} listName={title} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
