import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
});

import "./globals.css";
import AppShell from "./components/AppShell";

export const metadata: Metadata = {
  title: "Zainab Store",
  description:
    "Zainab Store is an online clothing store offering premium everyday and occasion wear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={playfairDisplay.variable}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}