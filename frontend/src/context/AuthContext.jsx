import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'patient_session';

export function AuthProvider({ children }) {
  const [token, setToken] = useState('');
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setToken(parsed.token || '');
        setPatient(parsed.patient || null);
      } catch (_) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (token && patient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, patient }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token, patient]);

  const login = (session) => {
    setToken(session.token);
    setPatient(session.patient);
  };

  const logout = () => {
    setToken('');
    setPatient(null);
  };

  const value = useMemo(
    () => ({
      token,
      patient,
      isAuthenticated: Boolean(token && patient),
      login,
      logout
    }),
    [token, patient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
