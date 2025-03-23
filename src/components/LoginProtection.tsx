import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginProtectionProps {
  children: React.ReactNode;
}

/**
 * LoginProtection component prevents authenticated users from accessing the login page.
 * If a user is already authenticated, they will be redirected to the appropriate dashboard.
 */
const LoginProtection: React.FC<LoginProtectionProps> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();

  // If user is already authenticated, redirect them to the appropriate page based on role
  if (isAuthenticated) {
    if (userRole === 'admin') {
      return <Navigate to="/products" replace />;
    } else if (userRole === 'cashier') {
      return <Navigate to="/pos" replace />;
    } else {
      // Default fallback route for any authenticated user
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If not authenticated, render the login page
  return <>{children}</>;
};

export default LoginProtection;