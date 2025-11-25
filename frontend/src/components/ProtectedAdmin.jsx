import React from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedAdmin({ children, onNavigate }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || !isAdmin) {
    return (
      <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
        <h2>Área restrita a administradores</h2>
        <p>Faça login como administrador para acessar esta página.</p>
        <button type="button" onClick={() => onNavigate("login")}>
          Ir para login
        </button>
      </div>
    );
  }

  return children;
}
