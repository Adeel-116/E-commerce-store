// import ImageSection from "./components/ImageSection";
// import ProductSlider from "./components/ProductSlider";
import ProductGrid from "./components/ProductGrid";
import CategorySection from "./components/CategorySection";
import Footer from "./components/Footer";
import HomeHero from "./components/HomeHero";
import NavbarController from "./components/NavbarController";
// import FooterTab from "./components/FooterTab";
import InfoStrip from "./components/InfoStrip";
import Banner from "./components/Banner";
import PromoSection from "./components/PromoSection";
import AboutUsReviews from "./components/AboutUsReviews";
import VideoSlider from "./components/VideoSlider";
export default function Home() {
  return (
    <>
      <NavbarController />
      <HomeHero />
      {/* <InfoStrip/> */}
      {/* <ProductSlider /> */}
      <CategorySection />
      <Banner/>
      {/* <PromoSection/> */}
      <ProductGrid />
      <AboutUsReviews />
      <VideoSlider />
    </>
  );
}