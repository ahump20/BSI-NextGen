/**
 * Login Page
 * Handles user authentication via Auth0 OAuth
 *
 * Features:
 * - Redirects to Auth0 login
 * - Displays loading state during redirect
 * - Shows error messages if login fails
 * - Remembers return URL after successful login
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card, { CardContent, CardHeader } from '../components/primitives/Card';
import Button from '../components/primitives/Button';
import LoadingState from '../components/common/LoadingState';

const Login: React.FC = () => {
  const { isAuthenticated, loading, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const returnTo = searchParams.get('returnTo') || '/';
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    // If already authenticated, redirect to return URL
    if (isAuthenticated && !loading) {
      navigate(returnTo);
    }
  }, [isAuthenticated, loading, returnTo, navigate]);

  useEffect(() => {
    // Display OAuth error if present
    if (errorParam) {
      setError(errorDescription || errorParam);
    }
  }, [errorParam, errorDescription]);

  const handleLogin = () => {
    try {
      login(returnTo);
    } catch (err) {
      setError('Failed to initiate login. Please try again.');
      console.error('[Login] Login error:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Checking authentication status..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Blaze Sports Intel
            </h1>
            <p className="text-gray-600">
              Sign in to access premium features and personalized analytics
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
            >
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                Authentication Error
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              variant="primary"
              fullWidth
              className="py-3 text-lg font-semibold"
            >
              Sign In with Auth0
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  New to Blaze Sports Intel?
                </span>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>
                By signing in, you agree to our{' '}
                <a
                  href="/terms"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              What you get with an account:
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Personalized team dashboards and alerts</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Save favorite players and track their performance</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Access to advanced analytics and predictive models</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Premium: NIL valuations, recruiting insights, and more
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
