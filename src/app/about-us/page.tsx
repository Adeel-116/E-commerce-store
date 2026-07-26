import type { Metadata } from 'next'
import Link from 'next/link'
import NavbarController from '../components/NavbarController'
import AboutUsReviews from '../components/AboutUsReviews'
import AboutUsContact from '../components/AboutUsContact'
import "../styles/about-us.css"
import "../styles/ShopPage.css"
import { SITE_NAME } from '../lib/seo'

export const metadata: Metadata = {
  title: "About Us",
  description: `Discover ${SITE_NAME} — thoughtfully designed, quality stitched and unstitched clothing for men and women, loved by customers across Pakistan.`,
  alternates: { canonical: "/about-us" },
  openGraph: {
    title: `About Us | ${SITE_NAME}`,
    description: `Discover ${SITE_NAME} — thoughtfully designed, quality stitched and unstitched clothing for men and women, loved by customers across Pakistan.`,
    url: "/about-us",
  },
}

function page() {
    return (
        <div className='about-us-container'>
            <NavbarController />

            {/* Hero Banner */}
            <div className="shop-page__hero" id='about-us-background-image'>
                <div className="shop-page__hero-overlay" />
                <div className="shop-page__hero-content">
                    <p className="shop-page__breadcrumb"><Link href="/">HOME</Link> / ABOUT US</p>
                    <h1 className="shop-page__hero-title">About Us</h1>
                    <span className="shop-page__hero-divider" />
                    <p className="shop-page__hero-subtitle">
                        Discover Zarya Style — thoughtfully designed clothing that brings
                        together comfort, quality, and everyday style.
                    </p>
                </div>
            </div>

            {/* Our Story */}
            <section className="about-story">
                <div className="about-story__text">
                    <p className="about-tag">Our Story</p>
                    <h2 className="about-story__heading">Crafted For Everyday Style</h2>
                    <p className="about-story__para">
                        At Zarya Style, our journey began with a simple belief: quality clothing shouldn&apos;t come with
                        an inflated price tag. We built this platform to bring you thoughtfully designed, comfortable pieces
                        without the markup you&apos;d expect from boutique fashion houses.
                    </p>
                    <p className="about-story__para">
                        Since then, our collection has grown into a curated range of everyday and occasion wear, loved by
                        customers across Pakistan for its fit, fabric quality, and attention to detail — from flowing maxis
                        to tailored suits. Every piece is chosen to help you feel confident, comfortable, and effortlessly
                        put together.
                    </p>
                </div>

                <div className="about-story__images">
                    <div className="about-story__img-wrap about-story__img--left">
                        <img src="/category-maxi.avif" alt="Zarya Style maxi dresses" className="about-story__img" />
                    </div>
                    <div className="about-story__img-wrap about-story__img--mid-top">
                        <img src="/category-fashion.avif" alt="Zarya Style Pakistani fashion wear" className="about-story__img" />
                    </div>
                    <div className="about-story__img-wrap about-story__img--mid-bot">
                        <img src="/category-western.avif" alt="Zarya Style western wear" className="about-story__img" />
                    </div>
                </div>
            </section>

            {/* Our Mission & Values */}
            <section className="about-mission">
                <h2 className="about-mission__heading">Our Mission &amp; Values</h2>
                <div className="about-mission__grid">
                    <div className="about-mission__card">
                        <h3 className="about-mission__card-title">Accessible Style</h3>
                        <p className="about-mission__card-text">
                            We believe great style shouldn&apos;t come with a great price tag. Our curated collection brings
                            quality fashion within reach, making it an everyday experience rather than a luxury.
                        </p>
                    </div>
                    <div className="about-mission__card">
                        <h3 className="about-mission__card-title">Quality &amp; Craftsmanship</h3>
                        <p className="about-mission__card-text">
                            Every piece at Zarya Style is cut from carefully selected fabric and finished with attention
                            to detail, so you can count on comfort and durability with every wear.
                        </p>
                    </div>
                    <div className="about-mission__card">
                        <h3 className="about-mission__card-title">Customer-Centric</h3>
                        <p className="about-mission__card-text">
                            Your satisfaction comes first. With nationwide delivery, secure payments, and responsive
                            support, we make sure your shopping experience is smooth from cart to doorstep.
                        </p>
                    </div>
                </div>
            </section>

            {/* Client Reviews Swiper */}
            <AboutUsReviews />

            {/* Contact Form */}
            <AboutUsContact />
        </div>
    )
}

export default page
