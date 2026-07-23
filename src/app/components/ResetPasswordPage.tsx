"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthFlow.css";
import StickNavbar from "./StickNavbar";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();

  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("reset_token");
    if (!storedToken) {
      router.replace("/forgot-password");
      return;
    }
    setResetToken(storedToken);
  }, [router]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      sessionStorage.removeItem("reset_token");
      sessionStorage.removeItem("reset_email");
      router.push("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not reset password. Please try again.");
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
            <h1 className="auth-flow-title">Reset Password</h1>
            <p className="auth-flow-subtitle">Enter your new password below.</p>
          </div>

          <form className="auth-flow-form" onSubmit={handleSubmit}>
            <div className="auth-flow-field">
              <label className="auth-flow-label">New Password</label>
              <div className="auth-flow-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  className="auth-flow-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-flow-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="auth-flow-field">
              <label className="auth-flow-label">Confirm Password</label>
              <div className="auth-flow-password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your new password"
                  className="auth-flow-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-flow-password-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-flow-button" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
