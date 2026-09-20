"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Star, X } from "lucide-react";
import api from "@/lib/axios";
import "../styles/ReviewsModal.css";

type Review = { _id: string; name: string; city?: string; text: string; rating: number; screenshot?: string; verified?: boolean; fictional?: boolean; createdAt?: string };

const samples: Review[] = [
  { _id: "showcase-maxi-1", name: "Maxi showcase", city: "Fictional sample", text: "Maxi bohat pyari hai, fabric soft hai aur fitting perfect ayi. Thank you!", rating: 5, screenshot: "/demo-reviews/maxi-1.png", verified: false, fictional: true },
  { _id: "showcase-maxi-2", name: "Maxi showcase", city: "Fictional sample", text: "Maxi receive ho gayi, colour bilkul pictures jaisa hai aur fall bohat graceful hai.", rating: 5, screenshot: "/demo-reviews/maxi-2.png", verified: false, fictional: true },
  { _id: "showcase-suit-1", name: "3-piece showcase", city: "Fictional sample", text: "3 piece suit ki embroidery neat hai, dupatta bhi bohat khoobsurat hai.", rating: 5, screenshot: "/demo-reviews/suit-1.png", verified: false, fictional: true },
  { _id: "showcase-suit-2", name: "3-piece showcase", city: "Fictional sample", text: "Suit ka fabric comfortable hai aur stitching finishing bohat achi hai.", rating: 5, screenshot: "/demo-reviews/suit-2.png", verified: false, fictional: true },
  { _id: "showcase-suit-3", name: "3-piece showcase", city: "Fictional sample", text: "Parcel time par mil gaya. Shirt, trouser aur dupatta teeno perfect hain.", rating: 5, screenshot: "/demo-reviews/suit-3.png", verified: false, fictional: true },
  { _id: "showcase-western-1", name: "Western showcase", city: "Fictional sample", text: "Western outfit ka cut modern hai aur size bilkul accurate aya.", rating: 5, screenshot: "/demo-reviews/western-1.png", verified: false, fictional: true },
];

export default function ReviewsModal() {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(samples);

  useEffect(() => {
    api.get("/reviews").then(({ data }) => {
      if (data.data?.length) setReviews(data.data);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [open]);

  const showcase = reviews.some((review) => review.fictional);

  return <>
    <button className="reviews-rail" onClick={() => setOpen(true)} aria-label="Open customer reviews">
      <span>Our Reviews</span><Star size={15} fill="currentColor" />
    </button>
    {open && <div className="reviews-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <section className="reviews-dialog" role="dialog" aria-modal="true" aria-labelledby="reviews-title">
        <header className="reviews-dialog-header">
          <div><p>{showcase ? "Client presentation" : "Real stories, thoughtfully shared"}</p><h2 id="reviews-title">{showcase ? "Review Showcase" : "Our Reviews"}</h2></div>
          <button onClick={() => setOpen(false)} aria-label="Close reviews"><X size={22} /></button>
        </header>
        <div className="reviews-summary"><strong>{showcase ? "5.0" : "4.9"}</strong><span>{[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}</span><small>{showcase ? "Fictional showcase content" : "Verified Pakistani customers"}</small></div>
        <div className="reviews-masonry">
          {reviews.map((review) => <article className={`review-story${review.screenshot ? " has-shot" : ""}`} key={review._id}>
            {review.screenshot && <img src={review.screenshot} alt={`Review shared by ${review.name}`} loading="lazy" />}
            <div className="review-story-body">
              <div className="review-author"><span>{review.name.charAt(0)}</span><div><strong>{review.name}</strong><small>{review.city || "Pakistan"}</small></div></div>
              <div className="review-stars">{Array.from({ length: review.rating || 5 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <p>{review.text}</p>
              {review.fictional && <span className="review-fictional">Fictional showcase review</span>}
              {!review.fictional && review.verified !== false && <span className="review-verified"><BadgeCheck size={14} fill="currentColor" /> Verified customer</span>}
            </div>
          </article>)}
        </div>
      </section>
    </div>}
  </>;
}
