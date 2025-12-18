import React from 'react';
import { Navigate } from 'react-router-dom';

// Usage: <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
const ProtectedRoute = ({ children, role }) => {
  // Get user info from localStorage (replace with context for real auth)
  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');

  // Not logged in
  if (!userName || !userRole) {
    return <Navigate to="/" replace />;
  }

  // Role mismatch
  if (role && userRole.toLowerCase() !== role.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
