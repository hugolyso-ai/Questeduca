import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from 'sonner';
import { AuthProvider } from "./context/AuthContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./components/AuthCallback";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import AssociationDashboard from "./pages/AssociationDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment (not query params) for session_id
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />

      {/* Payment Routes */}
      <Route
        path="/payment/success"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/cancel"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <PaymentCancel />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Parent Routes */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Association Routes */}
      <Route
        path="/association/dashboard"
        element={
          <ProtectedRoute allowedRoles={['association']}>
            <AssociationDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <AppRouter />
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}

export default App;
