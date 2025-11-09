'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser, AuthState } from '@bsi/shared';

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  authenticated: boolean;
  login: (returnTo?: string) => void;
  logout: (returnTo?: string) => void;
  refresh: () => Promise<void>;
}

/**
 * React hook for authentication
 * Manages auth state and provides login/logout functions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current user from /api/auth/me
   */
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      });

      if (response.status === 401) {
        // Not authenticated
        setUser(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('[useAuth] Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize: Fetch user on mount
   */
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Login: Redirect to OAuth login flow
   */
  const login = useCallback((returnTo?: string) => {
    const params = new URLSearchParams();
    if (returnTo) {
      params.append('returnTo', returnTo);
    }

    const url = `/api/auth/login${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    window.location.href = url;
  }, []);

  /**
   * Logout: Clear session and redirect
   */
  const logout = useCallback((returnTo?: string) => {
    const params = new URLSearchParams();
    if (returnTo) {
      params.append('returnTo', returnTo);
    }

    const url = `/api/auth/logout${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    window.location.href = url;
  }, []);

  return {
    user,
    loading,
    error,
    authenticated: user !== null,
    login,
    logout,
    refresh: fetchUser,
  };
}
