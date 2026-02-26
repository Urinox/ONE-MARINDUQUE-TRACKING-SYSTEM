import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "src/app.jsx";
import Dashboard from "src/dashboard.jsx";
import Loader from "src/loader.jsx";
import FAS from "src/financial-administration-and-sustainability.jsx";
import DP from "src/disaster-preparedness.jsx";
import SPS from "src/social-protection-and-sensitivity.jsx";
import HCR from "src/health-compliance-and-responsiveness.jsx";
import SED from "src/sustainable-education.jsx";
import BFC from "src/business-friendliness-and-competitiveness.jsx";
import SPO from "src/safety-peace-and-order.jsx";
import EM from "src/environmental-management.jsx";
import THDCA from "src/tourism-heritage-development-culture-and-arts.jsx";
import YD from "src/youth-development.jsx";

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
      <Route path="/financial-administration-and-sustainability" element={<FAS />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/disaster-preparedness" element={<DP />} />
      <Route path="/social-protection-and-sensitivity" element={<SPS />} />
      <Route path="/health-compliance-and-responsiveness" element={<HCR />} />
      <Route path="/sustainable-education" element={<SED />} />
      <Route path="/business-friendliness-and-competitiveness" element={<BFC />} />
      <Route path="/safety-peace-and-order" element={<SPO />} />
      <Route path="/environmental-management" element={<EM />} />
      <Route path="/tourism-heritage-development-culture-and-arts" element={<THDCA />} />
      <Route path="/youth-development" element={<YD />} />
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