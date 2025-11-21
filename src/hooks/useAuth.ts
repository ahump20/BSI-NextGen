/**
 * useAuth Hook
 * React hook for managing authentication state
 */

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'premium' | 'admin';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface UseAuthReturn extends AuthState {
  login: (returnTo?: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  /**
   * Fetch current user from /api/auth/me
   */
  const fetchUser = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch('https://blazesportsintel.com/api/auth/me', {
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated
          setState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
          });
          return;
        }

        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json();

      setState({
        user: data.user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('[useAuth] Failed to fetch user:', error);
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        isAuthenticated: false,
      });
    }
  }, []);

  /**
   * Redirect to login
   */
  const login = useCallback((returnTo?: string) => {
    const params = new URLSearchParams();
    if (returnTo) {
      params.append('returnTo', returnTo);
    }

    window.location.href = `https://blazesportsintel.com/api/auth/login${params.toString() ? `?${params}` : ''}`;
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      const response = await fetch('https://blazesportsintel.com/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear local state
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });

      // Redirect will happen from server response
    } catch (error) {
      console.error('[useAuth] Logout failed:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Logout failed',
      }));
    }
  }, []);

  /**
   * Refresh user data
   */
  const refresh = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    ...state,
    login,
    logout,
    refresh,
  };
}
