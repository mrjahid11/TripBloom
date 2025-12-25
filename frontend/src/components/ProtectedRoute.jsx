import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Usage: <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();

  // Not logged in
  if (!user || !user.id) return <Navigate to="/" replace />;

  // Role mismatch
  if (role && user.role && user.role.toLowerCase() !== role.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
