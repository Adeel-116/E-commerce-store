"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthFlow.css";
import StickNavbar from "./StickNavbar";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      sessionStorage.setItem("reset_email", email);
      router.push("/verify-otp");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StickNavbar />
      <main className="auth-flow-container">
        <div className="auth-flow-card">
          <div className="auth-flow-header">
            <h1 className="auth-flow-title">Forgot Password</h1>
            <p className="auth-flow-subtitle">
              Enter your email and we&apos;ll send you an OTP to reset your password.
            </p>
          </div>

          <form className="auth-flow-form" onSubmit={handleSubmit}>
            <div className="auth-flow-field">
              <label className="auth-flow-label">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="auth-flow-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-flow-button" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <p className="auth-flow-footer">
            Remembered your password?{" "}
            <a href="/login" className="auth-flow-footer-link">
              Log In
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
