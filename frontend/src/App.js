// frontend/src/App.js
import { useEffect } from "react";
import {
  Navigate,
  Route,
  HashRouter as Router,
  Routes,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

// Composant pour protéger les routes
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("itc_token"); // Vérifie si le token existe
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("itc_theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const activeTheme = storedTheme || preferredTheme;

    document.documentElement.setAttribute("data-theme", activeTheme);
    document.documentElement.style.colorScheme = activeTheme;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });

      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<Login />} />

        {/* Route protégée par PrivateRoute */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Redirection par défaut vers le login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
