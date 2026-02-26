import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "src/app.jsx";
import Dashboard from "src/dashboard.jsx";
import Loader from "src/loader.jsx";
import Financial from "src/financial.jsx";

function Root() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader for 2 seconds (simulate loading)
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <Routes>
      <Route path="/login" element={<App />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/financial" element={<Financial />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>
);