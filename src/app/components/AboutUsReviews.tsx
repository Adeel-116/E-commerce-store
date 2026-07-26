"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";
import "../styles/about-us.css";

const reviews = [
    {
        id: 1,
        name: "Ayesha Khan",
        role: "Lahore",
        rating: 5,
        text: "The stitching and fabric quality on my maxi are so much better than I expected for the price. It fit me perfectly and the color was exactly like the pictures. Ordering again for sure.",
        initial: "A",
    },
    {
        id: 2,
        name: "Mahnoor Ahmed",
        role: "Karachi",
        rating: 5,
        text: "I was a little worried about ordering a 3 piece suit online but this store nailed the sizing. The fabric feels premium and comfortable, perfect for everyday wear. Got so many compliments.",
        initial: "M",
    },
    {
        id: 3,
        name: "Zara Fatima",
        role: "Islamabad",
        rating: 5,
        text: "Loved the 2 piece suit I ordered, the embroidery detail is beautiful in person. Delivery was quick and the packaging felt really premium. Definitely my new favorite store.",
        initial: "Z",
    },
    {
        id: 4,
        name: "Bilal Sheikh",
        role: "Rawalpindi",
        rating: 5,
        text: "Ordered a 3 piece suit for my sister and the finishing is really clean. True to size and the fabric doesn't feel cheap at all. Fast delivery too.",
        initial: "B",
    },
    {
        id: 5,
        name: "Hira Malik",
        role: "Faisalabad",
        rating: 5,
        text: "This is the third time I'm ordering from here, maxis and 2 piece suits both, and every single piece has been worth it. The prints are so pretty and the fit is always spot on. Highly recommend to anyone on the fence.",
        initial: "H",
    },
    {
        id: 6,
        name: "Sana Raza",
        role: "Multan",
        rating: 5,
        text: "Absolutely in love with my maxi, so comfortable and flowy. It photographs even better in person. Customer service was also super helpful with sizing questions.",
        initial: "S",
    },
    {
        id: 7,
        name: "Komal Iqbal",
        role: "Lahore",
        rating: 5,
        text: "The quality of my 3 piece suit genuinely surprised me, doesn't feel like a budget-friendly price at all. Fits true to size and the fabric is breathable, perfect for daily wear.",
        initial: "K",
    },
];

const Stars = ({ count }: { count: number }) => (
    <div className="au-review__stars">
        {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < count ? "au-star au-star--filled" : "au-star"}>
                ★
            </span>
        ))}
    </div>
);

const AboutUsReviews = () => {
    return (
        <section className="au-reviews">
            <div className="au-reviews__inner">
                <p className="au-reviews__tag">Testimonials</p>
                <h2 className="au-reviews__heading">What Our Clients Say</h2>
                <span className="au-reviews__divider" />

                <div className="au-reviews__slider-wrap">
                    
                    <Swiper
                        modules={[Autoplay, Navigation, Pagination]}
                        spaceBetween={24}
                        slidesPerView={1}
                        breakpoints={{
                            768: { slidesPerView: 2 },
                            1100: { slidesPerView: 3 },
                        }}
                        autoplay={{ delay: 4500, disableOnInteraction: false }}
                        loop={true}
                        navigation={{
                            nextEl: ".au-rev-btn-next",
                            prevEl: ".au-rev-btn-prev",
                        }}
                        pagination={{ clickable: true, el: ".au-rev-pagination" }}
                        className="au-swiper"
                    >
                        {reviews.map((r) => (
                            <SwiperSlide key={r.id}>
                                <div className="au-review__card">
                                    <span className="au-review__quote">&ldquo;</span>
                                    <Stars count={r.rating} />
                                    <p className="au-review__text">{r.text}</p>
                                    <div className="au-review__author">
                                        <div className="au-review__avatar">{r.initial}</div>
                                        <div>
                                            <p className="au-review__name">{r.name}</p>
                                            <p className="au-review__role">{r.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <button className="au-rev-btn au-rev-btn-prev" aria-label="Previous review">
                        <SlArrowLeft />
                    </button>
                    <button className="au-rev-btn au-rev-btn-next" aria-label="Next review">
                        <SlArrowRight />
                    </button>
                    <div className="au-rev-pagination" />
                </div>
            </div>
        </section>
    );
};

export default AboutUsReviews;
