import type { Metadata } from "next";
import RegisterPage from "../components/RegisterPage";

export const metadata: Metadata = {
  title: "Register",
  robots: { index: false, follow: false },
};

export default function Register() {
  return <RegisterPage />;
}
