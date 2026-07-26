import type { Metadata } from "next";
import ResetPasswordPage from "../components/ResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function ResetPassword() {
  return <ResetPasswordPage />;
}
