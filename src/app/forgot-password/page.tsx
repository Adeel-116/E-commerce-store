import type { Metadata } from "next";
import ForgotPasswordPage from "../components/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
  alternates: { canonical: "/forgot-password" },
};

export default function ForgotPassword() {
  return <ForgotPasswordPage />;
}
