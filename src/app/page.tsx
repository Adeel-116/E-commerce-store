import type { Metadata } from "next";
import ProductGrid from "./components/ProductGrid";
import CategorySection from "./components/CategorySection";
import HomeHero from "./components/HomeHero";
import HomePerksMarquee from "./components/HomePerksMarquee";
import NavbarController from "./components/NavbarController";
import Banner, { SummerBanner } from "./components/Banner";
import AboutUsReviews from "./components/AboutUsReviews";
import VideoSlider from "./components/VideoSlider";
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
      <CategorySection />
      <Banner />
      <SummerBanner />
      <ProductGrid />
      <AboutUsReviews />
      <VideoSlider />
    </>
  );
}