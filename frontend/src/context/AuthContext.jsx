import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

const AuthContext = createContext(null);
const STORAGE_KEY = "patient_session";

/**
 * AuthProvider - Manages authentication state with httpOnly cookies
 * 
 * Features:
 * - Session stored as httpOnly cookie (secure, protected from XSS)
 * - User data persisted in sessionStorage for UI display
 * - Cookies sent automatically with credentials
 * - Handles session cleanup on logout with API call
 * 
 * Flow:
 * 1. On mount: Check sessionStorage for cached user data
 * 2. If found: Restore session state (cookie validates on API calls)
 * 3. On login: Save user data to sessionStorage (token in cookie)
 * 4. On logout: Call logout API to clear cookie + clear sessionStorage
 */

function decodeRoleFromPatient(patient) {
  // Determine role from patient/admin object
  if (!patient) return "patient";
  return patient.role || (patient.doctor_id ? "admin" : "patient");
}

export function AuthProvider({ children }) {
  const [patient, setPatient] = useState(null);
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication state from sessionStorage
    const initializeAuth = () => {
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        
        if (!cached) {
          // No cached session - user is logged out
          setLoading(false);
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(cached);
        } catch (parseError) {
          // Invalid JSON in sessionStorage - clear it
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Auth] Invalid JSON in sessionStorage, clearing:', parseError);
          }
          sessionStorage.removeItem(STORAGE_KEY);
          setLoading(false);
          return;
        }

        // Restore session (cookie will be validated on next API call)
        if (process.env.NODE_ENV === 'development') {
          console.info('[Auth] Restored session from sessionStorage');
        }
        setPatient(parsed.patient || null);
        setRole(parsed.role || decodeRoleFromPatient(parsed.patient));
        
      } catch (error) {
        // Unexpected error - clear everything and log
        console.error('[Auth] Unexpected error during initialization:', error);
        sessionStorage.removeItem(STORAGE_KEY);
        setPatient(null);
        setRole("patient");
      } finally {
        // Always set loading to false
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (patient) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ patient, role }));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [patient, role]);

  const login = (session) => {
    // session now only contains patient/admin data (no token)
    // Token is stored as httpOnly cookie by the server
    const nextRole = session.patient?.role || session.admin?.role || decodeRoleFromPatient(session.patient || session.admin);
    setPatient(session.patient || session.admin);
    setRole(nextRole);
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear httpOnly cookie
      const endpoint = role === "admin" ? "/api/admin/logout" : "/api/auth/logout";
      await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include", // Send cookies
      });
    } catch (error) {
      console.error('[Auth] Error calling logout API:', error);
      // Continue with local logout even if API call fails
    }
    
    // Clear local state
    setPatient(null);
    setRole("patient");
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      patient,
      role,
      loading,
      isAuthenticated: Boolean(patient),
      isAdmin: role === "admin",
      login,
      logout,
    }),
    [patient, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
