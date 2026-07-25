"use client";

import { usePathname } from "next/navigation";
import SmoothScrollProvider from "./SmoothScrollProvider";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { FilterProvider } from "../context/FilterContext";
import { AuthProvider } from "../context/AuthContext";
import CartSidebar from "./CartSidebar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import WhatsAppFloat from "./WhatsAppFloat";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // The admin dashboard brings its own auth/layout/chrome (see src/app/admin) —
  // it doesn't need the storefront's cart/wishlist/footer/whatsapp float.
  if (isAdmin) return <>{children}</>;

  return (
    <>
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
    </>
  );
}
