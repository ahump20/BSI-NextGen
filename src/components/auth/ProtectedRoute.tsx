/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 *
 * Usage:
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * Or with role requirement:
 * <ProtectedRoute requiredRole="premium">
 *   <PremiumFeature />
 * </ProtectedRoute>
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingState from '../common/LoadingState';
import Card, { CardContent } from '../primitives/Card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'premium' | 'admin';
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login',
}) => {
  const { user, loading, isAuthenticated, login } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Store current path to redirect back after login
    const returnTo = location.pathname + location.search;
    login(returnTo);
    return null;
  }

  // Check role if required
  if (requiredRole && user) {
    const roleHierarchy = { user: 0, premium: 1, admin: 2 };
    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Access Denied
                </h2>
                <p className="text-gray-600 mb-6">
                  This feature requires a {requiredRole} account.
                </p>
                {requiredRole === 'premium' && (
                  <button
                    onClick={() => (window.location.href = '/pricing')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upgrade to Premium
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
