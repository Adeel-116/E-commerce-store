"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/LoginPage.css";
import NavbarController from "./NavbarController";

export default function LoginPage() {
  const { login } = useAuth();
  const { mergeCart } = useCart();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userData = (await login(email, password)) as { role?: string } | void;
      // console.log("User Data in Login", userData)
      await mergeCart();
      if (userData?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <>
    <NavbarController />
    <main className="login-page-container">
      <div className="login-page-card">
        {/* Header */}
        <div className="login-page-header">
          <h1 className="login-page-title">Log In</h1>
          <p className="login-page-subtitle">Please login to your account.</p>
        </div>

        {/* Form */}
        <form className="login-page-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="login-page-field">
            <label className="login-page-label">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="login-page-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="login-page-field">
            <label className="login-page-label">Password</label>
            <div className="login-page-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="login-page-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-page-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="login-page-options">
            <a href="/forgot-password" className="login-page-forgot">
              Forgot Password?
            </a>
          </div>

          {/* Error */}
          {error && <p className="auth-error">{error}</p>}

          {/* Submit */}
          <button type="submit" className="login-page-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="login-page-footer">
          Don&apos;t have an account?{" "}
          <a href="/register" className="login-page-footer-link">
            Register Account
          </a>
        </p>
      </div>
    </main>
    </>
  );
}
