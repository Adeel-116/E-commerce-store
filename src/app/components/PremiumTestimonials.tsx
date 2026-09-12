"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../styles/PremiumTestimonials.css";
import "../styles/PremiumTestimonialsSlider.css";

const reviews = [
  { name: "Ayesha Khan", city: "Lahore", text: "The stitching and fabric quality exceeded my expectations. The fit was perfect and the colour looked just like the photographs." },
  { name: "Mahnoor Ahmed", city: "Karachi", text: "The fabric feels premium and comfortable, and the sizing was exactly right. The whole ordering experience felt effortless." },
  { name: "Zara Fatima", city: "Islamabad", text: "Beautiful embroidery, quick delivery and thoughtful packaging. The piece looked even better in person." },
  { name: "Hira Malik", city: "Faisalabad", text: "Every piece I have ordered has been worth it. The prints are beautiful, the fit is reliable and the quality feels considered." },
  { name: "Sana Raza", city: "Multan", text: "My maxi was comfortable, flowy and even prettier in person. Customer support was very helpful with my sizing questions." },
];

const Verified = () => <span className="pt-verified"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 1.8 2.1 1.5 2.6-.1.7 2.5 2.2 1.4-.9 2.4.9 2.4-2.2 1.4-.7 2.5-2.6-.1-2.1 1.5-2.1-1.5-2.6.1-.7-2.5-2.2-1.4.9-2.4-.9-2.4 2.2-1.4.7-2.5 2.6.1L10 1.8Z" /><path d="m6.7 10 2.1 2.1 4.5-4.5" /></svg>Verified customer</span>;

export default function PremiumTestimonials() {
  return <section className="premium-testimonials"><header className="pt-header"><div><p>Real stories, real style</p><h2>Loved across Pakistan</h2></div><div className="pt-summary"><strong>4.9</strong><span>★★★★★</span><small>Customer experiences</small></div></header><div className="pt-slider"><Swiper modules={[Autoplay, Navigation, Pagination]} slidesPerView={1} spaceBetween={0} speed={650} loop autoplay={{ delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true }} navigation={{ nextEl: ".pt-next", prevEl: ".pt-prev" }} pagination={{ el: ".pt-pagination", clickable: true }} breakpoints={{ 700: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }}>{reviews.map((review, index) => <SwiperSlide key={review.name}><article className="pt-card"><div className="pt-card-top"><span className="pt-index">0{index + 1}</span><span className="pt-stars">★★★★★</span></div><blockquote>“{review.text}”</blockquote><footer><div className="pt-avatar">{review.name[0]}</div><div><strong>{review.name}</strong><small>{review.city}, Pakistan</small><Verified /></div></footer></article></SwiperSlide>)}</Swiper><div className="pt-controls"><div className="pt-pagination" /><div className="pt-arrows"><button className="pt-prev" aria-label="Previous testimonial">←</button><button className="pt-next" aria-label="Next testimonial">→</button></div></div></div></section>;
}
