"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import api, { BASE_URL } from "../lib/axios";
import { gaIdentify } from "../lib/gaEvents";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyResetOtp: (email: string, otp: string) => Promise<string>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Populate from localStorage after mount so SSR and first client render match
  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  // Keep ref in sync with state so interceptors always read the latest token
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Identify the visitor to GA4 on every page once we know who they are (login, register, or restored session)
  useEffect(() => {
    if (user) {
      gaIdentify({ userId: user._id, email: user.email });
    }
  }, [user]);

  // Setup axios interceptors once they add the Barer Token In Authorization
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (accessTokenRef.current) {
        config.headers.Authorization = `Bearer ${accessTokenRef.current}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const { data } = await axios.get(`${BASE_URL}/refresh-token`, {
              withCredentials: true,
              timeout: 15000,
            });
            const newToken = data.accessToken;
            setAccessToken(newToken);
            accessTokenRef.current = newToken;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch {
            setUser(null);
            setAccessToken(null);
            accessTokenRef.current = null;
            localStorage.removeItem("auth_user");
            const path = window.location.pathname;
            if (!path.startsWith("/login") && !path.startsWith("/register")) {
              window.location.href = "/login";
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/refresh-token`, {
          withCredentials: true,
              timeout: 15000,
        });
        setAccessToken(data.accessToken);
        accessTokenRef.current = data.accessToken;
        const stored = localStorage.getItem("auth_user");
        if (stored) setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);


  // Login Method

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post("/user-login", { email, password });
    setUser(data.user);
    setAccessToken(data.accessToken);
    accessTokenRef.current = data.accessToken;
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    return data.user;
  };


  // Register Method
  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post("/user-registration", { name, email, password });
    // console.log("Data", data)
    setUser(data.user);
    // console.log("User Data", user)
    setAccessToken(data.accessToken);
    accessTokenRef.current = data.accessToken;
    localStorage.setItem("auth_user", JSON.stringify(data.user));
  };

  // Logout Method
  const logout = async () => {
    try {
      await api.post("/logout-user");
    } finally {
      setUser(null);
      setAccessToken(null);
      accessTokenRef.current = null;
      localStorage.removeItem("auth_user");
      window.location.replace("/");
    }
  };

  // Forgot Password - request an OTP be sent to the given email
  const forgotPassword = async (email: string) => {
    await api.post("/forgot-password", { email });
  };

  // Verify Reset OTP - returns the short-lived resetToken on success
  const verifyResetOtp = async (email: string, otp: string): Promise<string> => {
    const { data } = await api.post("/verify-reset-otp", { email, otp });
    return data.resetToken;
  };

  // Reset Password - consumes the resetToken issued by verifyResetOtp
  const resetPassword = async (resetToken: string, newPassword: string) => {
    await api.post("/reset-password", { resetToken, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
