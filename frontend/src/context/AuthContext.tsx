"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/lib/types";
import { clearTokens, isLoggedIn } from "@/lib/auth";
import api from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      api
        .get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);