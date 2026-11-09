"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Star } from "lucide-react";
import { fetchCustomerReviews, type CustomerReview } from "../lib/customerReviews";
import "../styles/ProductReviews.css";

export default function ProductReviews() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCustomerReviews().then(reviews => {
      if (!cancelled) setReviews(reviews);
    }).catch(() => { /* Product shopping stays available if reviews cannot load. */ });
    return () => { cancelled = true; };
  }, []);

  if (!reviews.length) return null;
  const average = (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  const move = (direction: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = (card?.getBoundingClientRect().width ?? el.clientWidth) + 20;
    const end = el.scrollWidth - el.clientWidth;
    const left = direction > 0 && el.scrollLeft >= end - 2 ? 0
      : direction < 0 && el.scrollLeft <= 2 ? end
      : el.scrollLeft + step * direction;
    el.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return <section className="product-reviews" aria-labelledby="product-reviews-title" aria-roledescription="carousel">
    <header className="product-reviews-header">
      <div><p className="product-reviews-eyebrow">From our customers</p><h2 id="product-reviews-title">Customer Reviews</h2><p className="product-reviews-summary"><Star size={16} fill="currentColor" aria-hidden="true" /><strong>{average} / 5</strong><span>Based on {reviews.length} store {reviews.length === 1 ? "review" : "reviews"}</span></p></div>
      {reviews.length > 1 && <div className="product-reviews-controls"><button type="button" aria-label="Previous customer review" aria-controls="product-reviews-track" onClick={() => move(-1)}><ArrowLeft size={20} /></button><button type="button" aria-label="Next customer review" aria-controls="product-reviews-track" onClick={() => move(1)}><ArrowRight size={20} /></button></div>}
    </header>
    <div ref={track} id="product-reviews-track" className="product-reviews-track" tabIndex={0} aria-label="Customer reviews, swipe or use arrow keys to browse" data-lenis-prevent-touch="true" onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      {reviews.map((review, index) => <article className="product-review-card" key={review._id} aria-label={`Review ${index + 1} of ${reviews.length}`}>
        {review.screenshot && <img className="product-review-shot" src={review.screenshot} alt={`Customer review shared by ${review.name}`} loading="lazy" decoding="async" />}
        <div className="product-review-body"><div className="product-review-stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} fill={i < review.rating ? "currentColor" : "none"} aria-hidden="true" />)}</div><blockquote>{review.text}</blockquote><footer><span className="product-review-avatar" aria-hidden="true">{review.name.charAt(0)}</span><div><strong>{review.name}</strong><small>{review.city || "Pakistan"}</small>{review.verified === true && <span className="product-review-verified"><BadgeCheck size={13} aria-hidden="true" />Verified customer</span>}</div></footer></div>
      </article>)}
    </div>
  </section>;
}
