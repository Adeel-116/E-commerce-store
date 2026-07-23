"use client";

import Link from "next/link";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import "../../app/styles/Wishlist.css";

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();


  return (
    <section className="wl-page">
      <div className="wl-hero">
        <p className="wl-breadcrumb">
          <Link href="/">HOME</Link> / WISHLIST
        </p>
        <h1 className="wl-title">My Wishlist</h1>
        <p className="wl-subtitle">
          {wishlistItems.length === 0
            ? "Your saved fragrances will appear here"
            : `${wishlistItems.length} ${wishlistItems.length === 1 ? "fragrance" : "fragrances"} saved`}
        </p>
      </div>

      <div className="wl-body">
        {wishlistItems.length === 0 ? (
          <div className="wl-empty">
            <div className="wl-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2>Nothing saved yet</h2>
            <p>
              Browse our collection and tap the heart icon on any fragrance to
              save it here.
            </p>
            <Link href="/shop" className="wl-shop-btn">
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="wl-grid">
            {wishlistItems.map((item) => (
              <div className="wl-card" key={item.id}>
                <div className="wl-card-image-wrap">
                  <img src={item.image} alt={item.name} className="wl-card-image" />
                  <button
                    className="wl-remove-btn"
                    onClick={() => removeFromWishlist(item.id)}
                    aria-label="Remove from wishlist"
                    title="Remove"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>

                <div className="wl-card-body">
                  <h3 className="wl-card-name">{item.name}</h3>
                  {item.description && (
                    <p className="wl-card-desc">{item.description}</p>
                  )}

                  <span className="wl-card-sale">
                    AED {item.price["50ml"]} - AED {item.price["100ml"]}
                  </span>
                  <button
                    className="wl-add-cart-btn"
                    onClick={() =>
                      addToCart({
                        id: item.id,
                        productName: item.name,
                        brand: "",
                        prices: item.price,
                        size: "50ml",
                        productImage: item.image,
                      })
                    }
                    disabled={item.stock === false}
                  >
                    {item.stock === false ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {wishlistItems.length > 0 && (
          <div className="wl-footer">
            <Link href="/shop" className="wl-continue-link">
              ← Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default Wishlist;
