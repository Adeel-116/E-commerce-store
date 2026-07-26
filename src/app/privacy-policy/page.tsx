import type { Metadata } from "next";
import PrivacyPolicy from "../components/PrivacyPolicy";
import { SITE_NAME } from "../lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Read how ${SITE_NAME} collects, uses, and protects your personal information when you shop with us.`,
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}
