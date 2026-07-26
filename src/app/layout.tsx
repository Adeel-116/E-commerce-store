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
  title: "Zarya Style",
  description:
    "Zarya Style is an online clothing store offering premium everyday and occasion wear.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}