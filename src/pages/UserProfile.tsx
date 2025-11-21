/**
 * User Profile Page
 * Displays and manages authenticated user information
 *
 * Features:
 * - Display user info (name, email, avatar, role)
 * - Account settings
 * - Logout functionality
 * - Role-based feature access (premium/admin)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card, { CardContent, CardHeader } from '../components/primitives/Card';
import Button from '../components/primitives/Button';
import LoadingState from '../components/common/LoadingState';

const UserProfile: React.FC = () => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate('/');
    } catch (error) {
      console.error('[UserProfile] Logout error:', error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Loading profile..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const roleColors = {
    user: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800',
    admin: 'bg-red-100 text-red-800',
  };

  const roleLabels = {
    user: 'Free User',
    premium: 'Premium Member',
    admin: 'Administrator',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Overview */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Account Information
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.email}
                  className="w-24 h-24 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-600">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Details */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-lg text-gray-900">
                  {user.name || 'Not provided'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-lg text-gray-900">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    roleColors[user.role]
                  }`}
                >
                  {roleLabels[user.role]}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <p className="text-sm text-gray-600 font-mono">{user.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Upgrade CTA (for free users) */}
      {user.role === 'user' && (
        <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  Upgrade to Premium
                </h3>
                <p className="text-sm text-purple-700 mb-4">
                  Unlock advanced analytics, NIL valuations, recruiting insights,
                  and more with a Premium membership.
                </p>
                <ul className="space-y-2 text-sm text-purple-800 mb-4">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Advanced predictive analytics and ML models
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    NIL valuations and recruiting insights
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Priority access to new features
                  </li>
                </ul>
              </div>
              <div className="ml-6">
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="primary"
                  className="whitespace-nowrap"
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Actions */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Account Actions
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Preferences
                </h3>
                <p className="text-sm text-gray-600">
                  Manage notification and display preferences
                </p>
              </div>
              <Button
                onClick={() => navigate('/settings')}
                variant="secondary"
                size="sm"
              >
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Favorite Teams
                </h3>
                <p className="text-sm text-gray-600">
                  Configure your favorite teams for personalized content
                </p>
              </div>
              <Button
                onClick={() => navigate('/favorites')}
                variant="secondary"
                size="sm"
              >
                Configure
              </Button>
            </div>

            {user.role === 'admin' && (
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Admin Dashboard
                  </h3>
                  <p className="text-sm text-gray-600">
                    Access administrative tools and analytics
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/admin')}
                  variant="secondary"
                  size="sm"
                >
                  Open
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3">
              <div>
                <h3 className="text-sm font-medium text-red-900">
                  Sign Out
                </h3>
                <p className="text-sm text-red-600">
                  Log out of your Blaze Sports Intel account
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="secondary"
                size="sm"
                disabled={loggingOut}
                className="text-red-700 hover:bg-red-50 hover:text-red-800 border-red-300"
              >
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Data & Privacy
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Your data is protected and managed according to our{' '}
              <a
                href="/privacy"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Privacy Policy
              </a>
              .
            </p>
            <p>
              We use secure authentication via Auth0 and never store your
              password. Your session is encrypted and automatically expires after
              7 days of inactivity.
            </p>
            <p>
              For questions about your data or to request deletion, contact us at{' '}
              <a
                href="mailto:privacy@blazesportsintel.com"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                privacy@blazesportsintel.com
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
