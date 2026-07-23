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
import WhatsAppFloat from "./components/WhatsAppFloat";


export const metadata: Metadata = {
  title: "Azan Collection",
  description:
    "Azan Collection is an online clothing store offering premium everyday and occasion wear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={playfairDisplay.variable}>
      <body>
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