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
        console.log('[Auth] Restored session from sessionStorage:', {
          hasPatient: !!parsed.patient,
          patientId: parsed.patient?.id,
          role: parsed.role,
          isAdmin: parsed.role === 'admin'
        });
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
      const sessionData = { patient, role };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      console.log('[Auth] SessionStorage updated:', {
        patientId: patient.id,
        role: role,
        isAdmin: role === 'admin'
      });
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      console.log('[Auth] SessionStorage cleared');
    }
  }, [patient, role]);

  const login = (session) => {
    // session now only contains patient/admin data (no token)
    // Token is stored as httpOnly cookie by the server
    console.log('[Auth] Login called with session:', {
      hasPatient: !!session.patient,
      hasAdmin: !!session.admin,
      patientRole: session.patient?.role,
      adminRole: session.admin?.role,
      sessionKeys: Object.keys(session)
    });

    const nextRole = session.patient?.role || session.admin?.role || decodeRoleFromPatient(session.patient || session.admin);
    const userData = session.patient || session.admin;
    
    console.log('[Auth] Setting authentication state:', {
      userData: userData ? { id: userData.id, name: userData.name, email: userData.email } : null,
      determinedRole: nextRole,
      isAdmin: nextRole === 'admin'
    });

    // CRITICAL: Save to sessionStorage synchronously BEFORE state updates
    // This prevents race condition on mobile browsers where navigation happens
    // before the useEffect has a chance to save the state
    if (userData) {
      const sessionData = { patient: userData, role: nextRole };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      console.log('[Auth] SessionStorage synchronously updated in login():', {
        patientId: userData.id,
        role: nextRole,
        isAdmin: nextRole === 'admin'
      });
    }

    setPatient(userData);
    setRole(nextRole);
    
    console.log('[Auth] Login completed, state updated');
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
