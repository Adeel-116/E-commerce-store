import type { Metadata } from "next";
import LoginPage from "../components/LoginPage";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default function Login() {
  return <LoginPage />;
}



