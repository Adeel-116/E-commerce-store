import type { Metadata } from "next";
import RegisterPage from "../components/RegisterPage";

export const metadata: Metadata = {
  title: "Register",
  robots: { index: false, follow: false },
  alternates: { canonical: "/register" },
};

export default function Register() {
  return <RegisterPage />;
}
