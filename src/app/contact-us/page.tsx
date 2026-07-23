import Link from 'next/link'
import NavbarController from '../components/NavbarController'
import "../styles/ShopPage.css"
import AboutUsContact from '../components/AboutUsContact'
function page() {
  return (
    <div>

      <NavbarController />

      {/* Hero Banner */}
      <div className="shop-page__hero" id='about-us-background-image'>
        <div className="shop-page__hero-overlay" />
        <div className="shop-page__hero-content">
          <p className="shop-page__breadcrumb"><Link href="/">HOME</Link> / CONTACT US</p>
          <h1 className="shop-page__hero-title">Contact Us</h1>
          <p className="shop-page__hero-subtitle">
            Shop from Our Extensive Cologne Collection and Buy Perfume That Truly
            Speaks to Your Individuality and Marks Your Signature Smell.
          </p>
        </div>
      </div>


      <AboutUsContact />

    </div>
  )
}

export default page