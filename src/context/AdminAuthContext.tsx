"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import api, { BASE_URL } from "@/lib/axios";

interface User {
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth_admin");
      if (stored) {
        try { return JSON.parse(stored); } catch { return null; }
      }
    }
    return null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

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
            const { data } = await axios.get(`${BASE_URL}/admin/refresh-token`, {
              withCredentials: true,
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
            localStorage.removeItem("auth_admin");
            window.location.href = "/admin/login";
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
        const { data } = await axios.get(`${BASE_URL}/admin/refresh-token`, {
          withCredentials: true,
        });
        setAccessToken(data.accessToken);
        accessTokenRef.current = data.accessToken;
        const stored = localStorage.getItem("auth_admin");
        if (stored) setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_admin");
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);


  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post("/admin-login", { email, password });
    if (data.user?.role !== "admin") {
      throw { response: { data: { message: "Access denied" } } };
    }
    setUser(data.user);
    setAccessToken(data.accessToken);
    accessTokenRef.current = data.accessToken;
    localStorage.setItem("auth_admin", JSON.stringify(data.user));
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/logout-admin");
    } finally {
      setUser(null);
      setAccessToken(null);
      accessTokenRef.current = null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
