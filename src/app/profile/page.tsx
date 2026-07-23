"use client";
import Navbar2 from "../components/Navbar2";
import UserProfile from "../components/UserProfile";
import Footer from "../components/Footer";
import NavbarController from "../components/NavbarController";
import StickNavbar from "../components/StickNavbar";

export default function ProfilePage() {
  return (
    <>
      <StickNavbar />
      <UserProfile />
    </>
  );
}
