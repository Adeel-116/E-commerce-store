import type { Metadata } from "next";
import ProductGrid from "./components/ProductGrid";
import CategorySection from "./components/CategorySection";
import HomeHero from "./components/HomeHero";
import HomePerksMarquee from "./components/HomePerksMarquee";
import NavbarController from "./components/NavbarController";
import { WinterBanner } from "./components/Banner";
import AboutUsReviews from "./components/AboutUsReviews";
// import VideoSlider from "./components/VideoSlider";
import { SITE_NAME, SITE_DESCRIPTION } from "./lib/seo";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Premium Everyday & Occasion Wear in Pakistan`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — Premium Everyday & Occasion Wear in Pakistan`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default function Home() {
  return (
    <>
      <NavbarController />
      <HomeHero />
      <HomePerksMarquee />
       <ProductGrid
        title="New Arrivals"
        collection="new-arrivals"
        subtitle="Discover the latest additions to our collection."
      />
      <CategorySection />
      <WinterBanner />
      <ProductGrid />
      <AboutUsReviews />
      {/* <VideoSlider /> */}
    </>
  );
}
