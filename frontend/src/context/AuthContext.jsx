import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "patient_session";

function decodeRoleFromToken(token) {
  if (!token) return "patient";
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.role || "patient";
  } catch (_) {
    return "patient";
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [patient, setPatient] = useState(null);
  const [role, setRole] = useState("patient");

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setToken(parsed.token || "");
        setPatient(parsed.patient || null);
        setRole(parsed.role || decodeRoleFromToken(parsed.token));
      } catch (_) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (token && patient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, patient, role }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token, patient, role]);

  const login = (session) => {
    const nextRole = decodeRoleFromToken(session.token);
    setToken(session.token);
    setPatient(session.patient);
    setRole(nextRole);
  };

  const logout = () => {
    setToken("");
    setPatient(null);
    setRole("patient");
  };

  const value = useMemo(
    () => ({
      token,
      patient,
      role,
      isAuthenticated: Boolean(token && patient),
      isAdmin: role === "admin",
      login,
      logout,
    }),
    [token, patient, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
