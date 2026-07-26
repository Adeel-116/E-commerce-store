import type { Metadata } from 'next'
import Link from 'next/link'
import NavbarController from '../components/NavbarController'
import "../styles/ShopPage.css"
import AboutUsContact from '../components/AboutUsContact'
import { SITE_NAME } from '../lib/seo'

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${SITE_NAME} for order questions, sizing help, or general enquiries. We reply by chat, email, and phone.`,
  alternates: { canonical: "/contact-us" },
  openGraph: {
    title: `Contact Us | ${SITE_NAME}`,
    description: `Get in touch with ${SITE_NAME} for order questions, sizing help, or general enquiries.`,
    url: "/contact-us",
  },
}

function page() {
  return (
    <div>

      <NavbarController />

      {/* Hero Banner */}
      <div className="shop-page__hero" id='about-us-background-image'>
        <div className="shop-page__hero-overlay" />
        <div className="shop-page__hero-content">
          <p className="shop-page__breadcrumb"><Link href="/">Home</Link> / Contact Us</p>
          <h1 className="shop-page__hero-title">Contact Us</h1>
          <span className="shop-page__hero-divider" />
          <p className="shop-page__hero-subtitle">
            Have a question about sizing, an order, or just want to say hello?
            We&apos;re here to help.
          </p>
        </div>
      </div>


      <AboutUsContact />

    </div>
  )
}

export default page