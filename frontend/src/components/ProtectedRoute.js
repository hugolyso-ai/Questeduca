import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', {
    path: location.pathname,
    loading,
    user: user?.email || null,
    userRole: user?.role || null,
    allowedRoles
  });

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-slate-700">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute: Role not allowed, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Access granted');
  return children;
};

export default ProtectedRoute;