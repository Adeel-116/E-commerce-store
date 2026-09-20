"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Star, X } from "lucide-react";
import api from "@/lib/axios";
import "../styles/ReviewsModal.css";

type Review = { _id: string; name: string; city?: string; text: string; rating: number; screenshot?: string; verified?: boolean; createdAt?: string };

export default function ReviewsModal() {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    api.get("/reviews").then(({ data }) => {
      setReviews(data.data ?? []);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [open]);

  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return <>
    <button className="reviews-rail" onClick={() => setOpen(true)} aria-label="Open customer reviews">
      <span>Our Reviews</span><Star size={15} fill="currentColor" />
    </button>
    {open && <div className="reviews-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <section   data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true" className="reviews-dialog" role="dialog" aria-modal="true" aria-labelledby="reviews-title">
        <header className="reviews-dialog-header">
          <div><p>Real stories, thoughtfully shared</p><h2 id="reviews-title">Our Reviews</h2></div>
          <button onClick={() => setOpen(false)} aria-label="Close reviews"><X size={22} /></button>
        </header>
        <div className="reviews-summary"><strong>{averageRating}</strong><span>{[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}</span><small>{reviews.length} customer reviews</small></div>
        <div className="reviews-masonry">
          {reviews.map((review) => <article className={`review-story${review.screenshot ? " has-shot" : ""}`} key={review._id}>
            {review.screenshot && <img src={review.screenshot} alt={`Review shared by ${review.name}`} loading="lazy" />}
            <div className="review-story-body">
              <div className="review-author"><span>{review.name.charAt(0)}</span><div><strong>{review.name}</strong><small>{review.city || "Pakistan"}</small></div></div>
              <div className="review-stars">{Array.from({ length: review.rating || 5 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <p>{review.text}</p>
              {review.verified !== false && <span className="review-verified"><BadgeCheck size={14} fill="currentColor" /> Verified customer</span>}
            </div>
          </article>)}
        </div>
      </section>
    </div>}
  </>;
}
