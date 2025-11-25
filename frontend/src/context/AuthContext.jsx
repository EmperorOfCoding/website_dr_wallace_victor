import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "patient_session";

/**
 * AuthProvider - Manages authentication state and session persistence
 * 
 * Features:
 * - Restores session from localStorage on mount
 * - Validates token expiration
 * - Handles session cleanup on logout
 * - Provides loading state for auth initialization
 * 
 * Flow:
 * 1. On mount: Check localStorage for cached session
 * 2. If found: Validate token expiration
 * 3. If valid: Restore session state
 * 4. If invalid/expired: Clear session and reset state
 * 5. Always: Set loading to false when initialization completes
 */

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

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch (_) {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [patient, setPatient] = useState(null);
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication state from localStorage
    const initializeAuth = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        
        if (!cached) {
          // No cached session - user is logged out
          // Ensure loading is set to false before returning
          setLoading(false);
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(cached);
        } catch (parseError) {
          // Invalid JSON in localStorage - clear it
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Auth] Invalid JSON in localStorage, clearing:', parseError);
          }
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }

        // Validate token expiration
        if (isTokenExpired(parsed.token)) {
          // Token is expired - clear session
          if (process.env.NODE_ENV === 'development') {
            console.info('[Auth] Token expired, clearing session');
          }
          localStorage.removeItem(STORAGE_KEY);
          // Explicitly reset state (though they're already at initial values)
          setToken("");
          setPatient(null);
          setRole("patient");
          setLoading(false);
          return;
        }

        // Token is valid - restore session
        if (process.env.NODE_ENV === 'development') {
          console.info('[Auth] Restored valid session from localStorage');
        }
        setToken(parsed.token || "");
        setPatient(parsed.patient || null);
        setRole(parsed.role || decodeRoleFromToken(parsed.token));
        
      } catch (error) {
        // Unexpected error - clear everything and log
        console.error('[Auth] Unexpected error during initialization:', error);
        localStorage.removeItem(STORAGE_KEY);
        setToken("");
        setPatient(null);
        setRole("patient");
      } finally {
        // Always set loading to false, regardless of success or failure
        // This ensures loading is set even if an error occurs before any return statement
        setLoading(false);
      }
    };

    initializeAuth();
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
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      patient,
      role,
      loading,
      isAuthenticated: Boolean(token && patient),
      isAdmin: role === "admin",
      login,
      logout,
    }),
    [token, patient, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
