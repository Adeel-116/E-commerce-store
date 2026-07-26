import type { Metadata } from "next";
import TermsAndCondition from "../components/TermsAndCondition";
import { SITE_NAME } from "../lib/seo";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms and conditions governing purchases, shipping, returns, and use of the ${SITE_NAME} website.`,
  alternates: { canonical: "/terms-and-conditions" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <TermsAndCondition />;
}
