import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/login' }) => {
  const location = useLocation();
  const authenticated = isAuthenticated();

  // If authentication is required and user is not authenticated
  if (requireAuth && !authenticated) {
    // Save the attempted URL to redirect back after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authentication is not required and user is authenticated (e.g., login page)
  if (!requireAuth && authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute; 