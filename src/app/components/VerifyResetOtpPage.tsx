"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthFlow.css";
import StickNavbar from "./StickNavbar";

export default function VerifyResetOtpPage() {
  const { verifyResetOtp, forgotPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("reset_email");
    if (!storedEmail) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const resetToken = await verifyResetOtp(email, otp);
      sessionStorage.setItem("reset_token", resetToken);
      router.push("/reset-password");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setResending(true);
    try {
      await forgotPassword(email);
      setInfo("A new OTP has been sent to your email.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <StickNavbar />
      <main className="auth-flow-container">
        <div className="auth-flow-card">
          <div className="auth-flow-header">
            <h1 className="auth-flow-title">Verify OTP</h1>
            <p className="auth-flow-subtitle">
              Enter the OTP sent to {email || "your email"}.
            </p>
          </div>

          <form className="auth-flow-form" onSubmit={handleSubmit}>
            <div className="auth-flow-field">
              <label className="auth-flow-label">OTP</label>
              <input
                type="text"
                placeholder="Enter the OTP"
                className="auth-flow-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-flow-success">{info}</p>}

            <button type="submit" className="auth-flow-button" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <p className="auth-flow-footer">
            Didn&apos;t get the code?{" "}
            <button
              type="button"
              className="auth-flow-footer-link"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Resending..." : "Resend OTP"}
            </button>
          </p>
        </div>
      </main>
    </>
  );
}
