"use client";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { fetchCustomerReviews, type CustomerReview } from "../lib/customerReviews";
import "swiper/css";
import "swiper/css/pagination";
import "../styles/PremiumTestimonials.css";
import "../styles/PremiumTestimonialsSlider.css";
import "../styles/CustomerReviewScreenshots.css";

export default function PremiumTestimonials() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchCustomerReviews().then(items => {
      if (!cancelled) setReviews(items);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  if (!reviews.length) return null;
  return <section className="premium-testimonials" aria-labelledby="customer-feedback-title">
    <header className="pt-header">
      <div><p>Real stories, real style</p><h2 id="customer-feedback-title">Loved across Pakistan</h2></div>
      <div className="pt-summary"><small>Customer experiences</small></div>
    </header>
    <div className="pt-slider">
      <Swiper modules={[Navigation, Pagination]} slidesPerView={1} spaceBetween={0} speed={650}
        navigation={{ nextEl: ".pt-next", prevEl: ".pt-prev" }}
        pagination={{ el: ".pt-pagination", clickable: true }}
        breakpoints={{ 700: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }}>
        {reviews.map((review, index) => <SwiperSlide key={review._id}>
          <article className={`pt-card${review.screenshot ? " pt-card--screenshot" : ""}`}>
            <div className="pt-card-top"><span className="pt-index">{String(index + 1).padStart(2, "0")}</span>
              {!review.screenshot && <span className="pt-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}</span>}
            </div>
            {review.screenshot ? <a href={review.screenshot} target="_blank" rel="noopener noreferrer" className="pt-screenshot-link" aria-label="Open customer feedback screenshot">
              <img className="pt-screenshot" src={review.screenshot} alt={review.text} loading="lazy" decoding="async" />
            </a> : <blockquote>“{review.text}”</blockquote>}
            <footer><div className="pt-avatar" aria-hidden="true">{review.name.charAt(0)}</div>
              <div><strong>{review.name}</strong><small>{review.screenshot ? "Shared customer feedback" : review.city || "Pakistan"}</small></div>
            </footer>
          </article>
        </SwiperSlide>)}
      </Swiper>
      <div className="pt-controls"><div className="pt-pagination" /><div className="pt-arrows">
        <button className="pt-prev" aria-label="Previous testimonial">←</button>
        <button className="pt-next" aria-label="Next testimonial">→</button>
      </div></div>
    </div>
  </section>;
}
