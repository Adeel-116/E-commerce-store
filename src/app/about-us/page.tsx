import Link from 'next/link'
import NavbarController from '../components/NavbarController'
import AboutUsReviews from '../components/AboutUsReviews'
import AboutUsContact from '../components/AboutUsContact'
import "../styles/about-us.css"
import "../styles/ShopPage.css"

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
                    <p className="shop-page__hero-subtitle">
                        Shop from Our Extensive Cologne Collection and Buy Perfume That Truly
                        Speaks to Your Individuality and Marks Your Signature Smell.
                    </p>
                </div>
            </div>

            {/* Our Story */}
            <section className="about-story">
                <div className="about-story__text">
                    {/* <p className="about-tag">Since 2021</p> */}
                    <h2 className="about-story__heading">Our Story</h2>
                    <p className="about-story__para">
                        At Monk Perfumes, our journey began with a profound realization: niche perfumes were either overpriced or
                        hard to access. We built this platform to change that, to offer fragrance lovers a trusted space to explore
                        authentic, carefully selected scents without inflated prices or confusion. Since then, our collection has
                        grown into a refined catalog of rare and designer scents, trusted by thousands and praised by respected
                        voices in the fragrance world.
                    </p>
                    <p className="about-story__para">
                        Fast forward to today, we&apos;re incredibly proud of how far we&apos;ve come. We&apos;ve processed over
                        10,000 orders, earning the trust of a rapidly expanding global community. From worldwide shipping, to
                        giveaways, loyalty rewards, and seasonal sales, everything we do is built to make your fragrance journey
                        personal, seamless, and truly unforgettable.
                    </p>
                </div>

                <div className="about-story__images">
                    <div className="about-story__img-wrap about-story__img--left">
                        <img src="/card1.avif" alt="Monk Perfumes story" className="about-story__img" />
                    </div>
                    <div className="about-story__img-wrap about-story__img--mid-top">
                        <img src="/card2.avif" alt="Monk Perfumes fragrances" className="about-story__img" />
                    </div>
                    <div className="about-story__img-wrap about-story__img--mid-bot">
                        <img src="/card3.avif" alt="Monk Perfumes collection" className="about-story__img" />
                    </div>
                </div>
            </section>

            {/* Our Mission & Values */}
            <section className="about-mission">
                <h2 className="about-mission__heading">Our Mission &amp; Values</h2>
                <div className="about-mission__grid">
                    <div className="about-mission__card">
                        <h3 className="about-mission__card-title">Accessible Luxury</h3>
                        <p className="about-mission__card-text">
                            At Monk Scents, we believe exceptional fragrances shouldn&apos;t come with an exceptional price tag. Our
                            carefully curated collection brings premium niche scents within reach, making luxury fragrance an
                            everyday experience.
                        </p>
                    </div>
                    <div className="about-mission__card">
                        <h3 className="about-mission__card-title">Authenticity &amp; Quality</h3>
                        <p className="about-mission__card-text">
                            Every fragrance at Monk Scents is sourced from trusted suppliers and carefully inspected before it
                            reaches you. We&apos;re committed to delivering authentic, high-quality perfumes that meet the
                            standards fragrance enthusiasts expect.
                        </p>
                    </div>
                    <div className="about-mission__card">
                        <h3 className="about-mission__card-title">Customer-Centric</h3>
                        <p className="about-mission__card-text">
                            Your satisfaction is our priority. With worldwide shipping, secure payments, and dedicated chat
                            support, we ensure your fragrance experience is smooth, reliable, and enjoyable.
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
