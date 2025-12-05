import { AnimatePresence } from "framer-motion";
import { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

// Pages
import AdminAgenda from "./pages/AdminAgenda";
import AdminCalendar from "./pages/AdminCalendar";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMetrics from "./pages/AdminMetrics";
import AdminPatientDetails from "./pages/AdminPatientDetails";
import AdminPatients from "./pages/AdminPatients";
import Agendar from "./pages/Agendar";
import AppointmentDetails from "./pages/AppointmentDetails";
import Contato from "./pages/Contato";
import Dashboard from "./pages/Dashboard";
import DocumentUpload from "./pages/DocumentUpload";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MinhaAgenda from "./pages/MinhaAgenda";
import PatientExams from "./pages/PatientExams";
import Perfil from "./pages/Perfil";
import Register from "./pages/Register";
import ReviewAppointment from "./pages/ReviewAppointment";
import Servicos from "./pages/Servicos";
import Sobre from "./pages/Sobre";

// Components
import Footer from "./components/Footer";
import Header from "./components/Header";
import PageTransition from "./components/PageTransition";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Theme Context
const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("dr_wallace_theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("dr_wallace_theme", darkMode ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading, role } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Checking access:', {
    path: location.pathname,
    loading,
    isAuthenticated,
    isAdmin,
    role,
    adminOnly
  });

  if (loading) {
    console.log('[ProtectedRoute] Still loading, showing loading screen');
    return <div className="loading-screen">Carregando...</div>;
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log('[ProtectedRoute] Admin required but user is not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[ProtectedRoute] Access granted');
  return children;
}

// Router wrapper component that provides navigation
function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  /**
   * Central navigation handler that converts legacy page names to React Router paths.
   * 
   * Supports three types of navigation:
   * 1. Static mapped routes (e.g., "agendar" ? "/agendar")
   * 2. Dynamic routes with parameters (e.g., "avaliar/123" ? "/avaliar/123")
   * 3. Routes with query parameters (e.g., "agendar?date=2024-01-15")
   * 
   * @param {string} path - Can be a routeMap key, a dynamic path, or path with query params
   */
  const handleNavigate = (path) => {
    // Separate path from query string
    const [basePath, queryString] = path.split("?");

    // Convert old page names to new routes
    const routeMap = {
      home: "/",
      sobre: "/sobre",
      servicos: "/servicos",
      contato: "/contato",
      login: "/login",
      cadastro: "/cadastro",
      agendar: "/agendar",
      "minha-agenda": "/minha-agenda",
      perfil: "/perfil",
      dashboard: "/dashboard",
      exames: "/exames",
      admin: "/painel-medico",
      "painel-medico-pacientes": "/painel-medico/pacientes",
      "painel-medico-agenda": "/painel-medico/agenda",
      "painel-medico-calendario": "/painel-medico/calendario",
      "painel-medico-metricas": "/painel-medico/metricas",
    };

    let route;

    // Check if it's in the routeMap
    if (routeMap[basePath]) {
      route = routeMap[basePath];
    }
    // Check if it's a dynamic route (contains a slash - like "avaliar/123" or "documentos/456")
    else if (basePath.includes("/")) {
      // For dynamic routes, just prepend "/" to create the full path
      route = `/${basePath}`;
    }
    // Fallback for unmapped routes
    else {
      route = `/${basePath}`;
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `?? Navigation to unmapped route: "${basePath}". ` +
          `Consider adding it to routeMap in App.jsx for consistency.`
        );
      }
    }

    // Navigate with query parameters if present
    navigate(queryString ? `${route}?${queryString}` : route);
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/") return "home";

    // Create reverse mapping from paths to keys
    const routeMap = {
      home: "/",
      sobre: "/sobre",
      servicos: "/servicos",
      contato: "/contato",
      login: "/login",
      cadastro: "/cadastro",
      agendar: "/agendar",
      "minha-agenda": "/minha-agenda",
      perfil: "/perfil",
      dashboard: "/dashboard",
      exames: "/exames",
      admin: "/painel-medico",
      "painel-medico-pacientes": "/painel-medico/pacientes",
      "painel-medico-agenda": "/painel-medico/agenda",
      "painel-medico-calendario": "/painel-medico/calendario",
      "painel-medico-metricas": "/painel-medico/metricas",
      avaliar: "/avaliar",
      documentos: "/documentos",
    };

    // Create reverse lookup map
    const pathToKeyMap = Object.entries(routeMap).reduce((acc, [key, routePath]) => {
      acc[routePath] = key;
      return acc;
    }, {});

    // Try exact match first
    if (pathToKeyMap[path]) {
      return pathToKeyMap[path];
    }

    // For dynamic routes, remove the last segment (parameter) and try again
    // e.g., /avaliar/123 -> /avaliar, /documentos/456 -> /documentos
    const pathWithoutParam = path.replace(/\/[^/]+$/, '');
    if (pathWithoutParam !== path && pathToKeyMap[pathWithoutParam]) {
      return pathToKeyMap[pathWithoutParam];
    }

    // Fallback: convert path to key format (remove leading slash, replace slashes with hyphens)
    const key = path.replace(/^\//, "").replace(/\//g, "-");
    return key || "home";
  };

  return (
    <>
      <Header
        currentPage={getCurrentPage()}
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        onLogout={logout}
      />
      <main style={{ marginTop: "8px" }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={
              isAuthenticated ? (
                (() => {
                  console.log('[App] Home route redirect:', { isAuthenticated, isAdmin, redirectTo: isAdmin ? '/painel-medico' : '/dashboard' });
                  return <Navigate to={isAdmin ? "/painel-medico" : "/dashboard"} replace />;
                })()
              ) : (
                <PageTransition><Home onNavigate={handleNavigate} /></PageTransition>
              )
            } />
            <Route path="/sobre" element={<PageTransition><Sobre onNavigate={handleNavigate} /></PageTransition>} />
            <Route path="/servicos" element={<PageTransition><Servicos onNavigate={handleNavigate} /></PageTransition>} />
            <Route path="/contato" element={<PageTransition><Contato /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login onNavigate={handleNavigate} /></PageTransition>} />
            <Route path="/cadastro" element={<PageTransition><Register onNavigate={handleNavigate} /></PageTransition>} />

            {/* Protected Patient Routes */}
            <Route
              path="/agendar"
              element={
                <ProtectedRoute>
                  <PageTransition><Agendar onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/minha-agenda"
              element={
                <ProtectedRoute>
                  <PageTransition><MinhaAgenda onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <PageTransition><Perfil onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PageTransition><Dashboard onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exames"
              element={
                <ProtectedRoute>
                  <PageTransition><PatientExams onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/avaliar/:appointmentId"
              element={
                <ProtectedRoute>
                  <PageTransition><ReviewAppointment onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documentos"
              element={
                <ProtectedRoute>
                  <PageTransition><DocumentUpload onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documentos/:appointmentId"
              element={
                <ProtectedRoute>
                  <PageTransition><DocumentUpload onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/consulta/:appointmentId"
              element={
                <ProtectedRoute>
                  <PageTransition><AppointmentDetails onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/painel-medico"
              element={
                <ProtectedRoute adminOnly>
                  <PageTransition><AdminDashboard onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/painel-medico/pacientes"
              element={
                <ProtectedRoute adminOnly>
                  <PageTransition><AdminPatients onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/painel-medico/pacientes/:id"
              element={
                <ProtectedRoute adminOnly>
                  <PageTransition><AdminPatientDetails onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/painel-medico/agenda"
              element={
                <ProtectedRoute adminOnly>
                  <PageTransition><AdminAgenda onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/painel-medico/calendario"
              element={
                <ProtectedRoute adminOnly>
                  <PageTransition><AdminCalendar onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/painel-medico/metricas"
              element={
                <ProtectedRoute adminOnly>
                  <PageTransition><AdminMetrics onNavigate={handleNavigate} /></PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
