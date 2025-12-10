import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function DashboardRouter({ user }) {
  if (!user || !user.roles) return <Navigate to="/" />;
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  if (roles.includes('admin') || roles.includes('ADMIN')) {
    return <Navigate to="/admin" />;
  }
  if (roles.includes('operator') || roles.includes('OPERATOR')) {
    return <Navigate to="/operator" />;
  }
  if (roles.includes('customer') || roles.includes('CUSTOMER')) {
    return <Navigate to="/customer" />;
  }
  return <Navigate to="/" />;
}
