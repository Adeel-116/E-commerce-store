import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
});

import "./globals.css";
import SmoothScrollProvider from "./components/SmoothScrollProvider";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { FilterProvider } from "./context/FilterContext";
import { AuthProvider } from "./context/AuthContext";
import CartSidebar from "./components/CartSidebar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import MetaPixel from "./components/MetaPixel";
import TikTokPixel from "./components/TikTokPixel";
import WhatsAppFloat from "./components/WhatsAppFloat";


export const metadata: Metadata = {
  title: "Monk Scents",
  description:
    "Monk Scents is an online store selling perfumes and fragrances.",
  verification: {
    google: "googleecda28151414802b",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={playfairDisplay.variable}>
      <body>
        <MetaPixel />
        <TikTokPixel />
        <AuthProvider>
          <FilterProvider>
            <WishlistProvider>
              <CartProvider>
                <ScrollToTop />
                <SmoothScrollProvider>{children}</SmoothScrollProvider>
                <CartSidebar />
              </CartProvider>
            </WishlistProvider>
          </FilterProvider>
        </AuthProvider>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}