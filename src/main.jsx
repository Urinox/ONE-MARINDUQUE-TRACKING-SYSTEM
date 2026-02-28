import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import "./index.css";
import App from "src/PO/app.jsx";
import Dashboard from "src/PO/dashboard.jsx";
import Loader from "src/loader.jsx";
import FAS from "src/PO/financial-administration-and-sustainability.jsx";
import DP from "src/PO/disaster-preparedness.jsx";
import SPS from "src/PO/social-protection-and-sensitivity.jsx";
import HCR from "src/PO/health-compliance-and-responsiveness.jsx";
import SED from "src/PO/sustainable-education.jsx";
import BFC from "src/PO/business-friendliness-and-competitiveness.jsx";
import SPO from "src/PO/safety-peace-and-order.jsx";
import EM from "src/PO/environmental-management.jsx";
import THDCA from "src/PO/tourism-heritage-development-culture-and-arts.jsx";
import YD from "src/PO/youth-development.jsx";
import LGU from "src/LGU/lgu-assessment.jsx";
import LGUNotification from "src/LGU/lgu-notifications.jsx";

function ProtectedRoute({ children, allowedRoles }) {
  const auth = getAuth();
  const db = getDatabase();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    get(ref(db, `users/${user.uid}/role`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setRole(snapshot.val());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!auth.currentUser) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/login" replace />;

  return children;
}

function Root() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <Routes>
      <Route path="/login" element={<App />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
      path="/financial-administration-and-sustainability"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <FAS />
        </ProtectedRoute>
      }
    />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route
        path="/disaster-preparedness"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DP />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social-protection-and-sensitivity"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <SPS />
          </ProtectedRoute>
        }
      />

      <Route
        path="/health-compliance-and-responsiveness"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <HCR />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sustainable-education"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <SED />
          </ProtectedRoute>
        }
      />

      <Route
        path="/business-friendliness-and-competitiveness"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <BFC />
          </ProtectedRoute>
        }
      />

      <Route
        path="/safety-peace-and-order"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <SPO />
          </ProtectedRoute>
        }
      />

      <Route
        path="/environmental-management"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <EM />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tourism-heritage-development-culture-and-arts"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <THDCA />
          </ProtectedRoute>
        }
      />

      <Route
        path="/youth-development"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <YD />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lgu-assessment"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <LGU />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lgu-notification"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <LGUNotification />
          </ProtectedRoute>
        }
      />
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