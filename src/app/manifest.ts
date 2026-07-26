import type { MetadataRoute } from "next";
import { SITE_NAME } from "./lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Premium Everyday & Occasion Wear`,
    short_name: SITE_NAME,
    description:
      "Shop authentic, quality stitched and unstitched clothing for men and women, delivered across Pakistan.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f2",
    theme_color: "#1c1c1c",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
