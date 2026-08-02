"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { gaSignUp } from "../lib/gaEvents";
import { metaCompleteRegistration } from "../lib/metaEvents";
import "../styles/RegisterPage.css";
import StickNavbar from "./StickNavbar";

export default function RegisterPage() {
  const { register } = useAuth();
  const { mergeCart } = useCart();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      gaSignUp();
      metaCompleteRegistration();
      await mergeCart();
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <>
    <StickNavbar />
    <main className="register-page-container">
      <div className="register-page-card">
        {/* Header */}
        <div className="register-page-header">
          <h1 className="register-page-title">Register Account</h1>
          <p className="register-page-subtitle">
            Enter details to register a new account.
          </p>
        </div>

        {/* Form */}
        <form className="register-page-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="register-page-field">
            <label className="register-page-label">
              Full Name<span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="register-page-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="register-page-field">
            <label className="register-page-label">
              Email Address<span className="required">*</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="register-page-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="register-page-field">
            <label className="register-page-label">
              Password<span className="required">*</span>
            </label>
            <div className="register-page-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className="register-page-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="register-page-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="register-page-field">
            <label className="register-page-label">
              Confirm Password<span className="required">*</span>
            </label>
            <div className="register-page-password-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                className="register-page-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="register-page-password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <p className="auth-error">{error}</p>}

          {/* Submit */}
          <button type="submit" className="register-page-button" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <p className="register-page-footer">
          <a href="/login" className="register-page-footer-link">
            Log in to Existing Account
          </a>
        </p>
      </div>
    </main>
    </>
  );
}
