import type { Metadata } from "next";
import UserProfile from "../components/UserProfile";
import StickNavbar from "../components/StickNavbar";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <>
      <StickNavbar />
      <UserProfile />
    </>
  );
}
