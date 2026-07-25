'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shirt } from 'lucide-react';
import { useAuth } from '@/context/AdminAuthContext';
import '@/styles/admin-theme.css';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') router.replace('/admin');
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/admin');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg === 'Access denied') {
        setError('You do not have admin access.');
      } else {
        setError(msg ?? 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Shirt size={20} />
          </div>
          <div>
            <div className="login-logo-text">Azan Collection</div>
            <div className="login-logo-sub">Admin Dashboard</div>
          </div>
        </div>

        <h1 className="login-heading">Welcome back</h1>
        <p className="login-subheading">Sign in to access your dashboard</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="email">Email address</label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><Mail size={15} /></span>
              <input
                id="email"
                type="email"
                className={`login-input${error && !email ? ' login-input-error' : ''}`}
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><Lock size={15} /></span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`login-input${error && !password ? ' login-input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="login-spinner" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="login-footer-text">Azan Collection &copy; {new Date().getFullYear()} — Admin access only</p>
      </div>
    </main>
  );
}
