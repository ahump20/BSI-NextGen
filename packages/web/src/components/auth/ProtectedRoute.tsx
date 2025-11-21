'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import type { AuthUser } from '@bsi/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AuthUser['role'];
  requiredFeatureFlag?: string;
  fallbackPath?: string;
}

/**
 * Protected route wrapper component
 * Redirects to login if not authenticated
 * Shows upgrade prompt if role is insufficient
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredFeatureFlag,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { user, loading, authenticated, login } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !authenticated) {
      // Redirect to login with return path
      login(pathname);
    }
  }, [loading, authenticated, login, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect via useEffect
  if (!authenticated) {
    return null;
  }

  // Check role requirements
  if (requiredRole && user) {
    const roleHierarchy: Record<AuthUser['role'], number> = {
      user: 0,
      premium: 1,
      admin: 2,
    };

    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <svg
                className="mx-auto h-12 w-12 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-center mb-2">
              Premium Feature
            </h2>
            <p className="text-gray-600 text-center mb-4">
              This feature requires a {requiredRole} account.
            </p>

            <div className="space-y-2">
              {requiredRole === 'premium' && (
                <a
                  href="/pricing"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Premium
                </a>
              )}

              <a
                href="/"
                className="block w-full bg-gray-100 text-gray-700 text-center py-2 px-4 rounded hover:bg-gray-200 transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  if (requiredFeatureFlag && user) {
    const hasFeature = user.featureFlags?.includes(requiredFeatureFlag);

    if (!hasFeature) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <svg
                className="mx-auto h-12 w-12 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.105 0-2 .672-2 1.5S10.895 11 12 11s2-.672 2-1.5S13.105 8 12 8zm0 5c-1.105 0-2 .672-2 1.5S10.895 16 12 16s2-.672 2-1.5S13.105 13 12 13z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v1m0 10v1m-7 2h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-center mb-2">
              Unlock This Experience
            </h2>
            <p className="text-gray-600 text-center mb-4">
              Your account doesn&apos;t include access to this feature yet.
            </p>

            <div className="space-y-2">
              <a
                href="/pricing"
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                View upgrade options
              </a>

              <a
                href={fallbackPath}
                className="block w-full bg-gray-100 text-gray-700 text-center py-2 px-4 rounded hover:bg-gray-200 transition-colors"
              >
                Return
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  // Authenticated and authorized
  return <>{children}</>;
}
