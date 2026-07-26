import type { Metadata } from "next";
import VerifyResetOtpPage from "../components/VerifyResetOtpPage";

export const metadata: Metadata = {
  title: "Verify OTP",
  robots: { index: false, follow: false },
  alternates: { canonical: "/verify-otp" },
};

export default function VerifyOtp() {
  return <VerifyResetOtpPage />;
}
