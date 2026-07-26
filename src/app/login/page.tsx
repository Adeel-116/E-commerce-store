import type { Metadata } from "next";
import LoginPage from "../components/LoginPage";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default function Login() {
  return <LoginPage />;
}



