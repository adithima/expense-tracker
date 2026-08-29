import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './common/Spinner';
import Layout from './layout/Layout';

/**
 * ProtectedRoute
 * Wraps pages that require authentication.
 * - While the initial auth check is in progress, shows a full-page spinner
 *   (prevents a flash of the login page for an already-logged-in user on refresh).
 * - If not authenticated, redirects to /login.
 * - If authenticated, renders the requested page wrapped in the app Layout
 *   (sidebar + navbar).
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner fullPage size="lg" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;