"use client";

import { usePathname } from "next/navigation";
import WhatsAppChannel from "./components/WhatsAppChannel";
import PremiumFooter from "./components/PremiumFooter";
import PremiumTestimonials from "./components/PremiumTestimonials";
import CustomerTrustBar from "./components/CustomerTrustBar";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showStoreFooter = !pathname.startsWith("/admin") && !pathname.startsWith("/checkout");

  return <>{children}{isHome && <PremiumTestimonials />}{isHome && <WhatsAppChannel />}{showStoreFooter && <><CustomerTrustBar /><PremiumFooter /></>}</>;
}
