'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '@bsi/shared';
import { analytics } from '@bsi/shared';

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  authenticated: boolean;
  sessionStatus: 'loading' | 'active' | 'expired' | 'refreshing';
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
  const [sessionStatus, setSessionStatus] = useState<
    'loading' | 'active' | 'expired' | 'refreshing'
  >('loading');
  const [hasTrackedAuth, setHasTrackedAuth] = useState(false);

  const trackAuthEvent = useCallback(
    (event: string, payload?: Record<string, unknown>) => {
      try {
        analytics.track(event, payload);
      } catch (e) {
        console.warn('[useAuth] analytics error', e);
      }
    },
    []
  );

  const refreshSession = useCallback(async () => {
    try {
      setSessionStatus('refreshing');
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!refreshResponse.ok) {
        setSessionStatus('expired');
        return false;
      }

      const data = await refreshResponse.json();
      setUser(data.user);
      setSessionStatus('active');
      trackAuthEvent('auth_session_refreshed', {
        userId: data.user?.id,
        role: data.user?.role,
      });
      return true;
    } catch (err) {
      console.error('[useAuth] Error refreshing session:', err);
      setSessionStatus('expired');
      return false;
    }
  }, [trackAuthEvent]);

  /**
   * Fetch current user from /api/auth/me
   */
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSessionStatus('loading');

      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      });

      if (response.status === 401) {
        // Attempt session refresh before treating as unauthenticated
        const refreshed = await refreshSession();
        if (!refreshed) {
          setUser(null);
          setSessionStatus('expired');
          setHasTrackedAuth(false);
          setLoading(false);
          return;
        }
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
      setSessionStatus('active');
      if (!hasTrackedAuth && data.user) {
        trackAuthEvent('auth_authenticated', {
          userId: data.user.id,
          role: data.user.role,
          featureFlags: data.user.featureFlags,
        });
        setHasTrackedAuth(true);
      }
    } catch (err) {
      console.error('[useAuth] Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUser(null);
      setSessionStatus('expired');
      setHasTrackedAuth(false);
    } finally {
      setLoading(false);
    }
  }, [hasTrackedAuth, refreshSession, trackAuthEvent]);

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

    trackAuthEvent('auth_login_redirect', { returnTo });
    window.location.href = url;
  }, [trackAuthEvent]);

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

    trackAuthEvent('auth_logout', { returnTo, userId: user?.id });
    window.location.href = url;
  }, [trackAuthEvent, user?.id]);

  return {
    user,
    loading,
    error,
    authenticated: user !== null,
    sessionStatus,
    login,
    logout,
    refresh: fetchUser,
  };
}
