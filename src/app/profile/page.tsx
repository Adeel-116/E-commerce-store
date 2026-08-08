import type { Metadata } from "next";
import UserProfile from "../components/UserProfile";
import NavbarController from "../components/NavbarController";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
  alternates: { canonical: "/profile" },
};

export default function ProfilePage() {
  return (
    <>
      <NavbarController />
      <UserProfile />
    </>
  );
}
