'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Team {
  id: string;
  name: string;
  sport: string;
}

interface UserPreferences {
  favoriteTeams: Team[];
  darkMode: boolean;
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

interface PreferencesContextType {
  preferences: UserPreferences;
  addFavoriteTeam: (team: Team) => void;
  removeFavoriteTeam: (teamId: string) => void;
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  favoriteTeams: [],
  darkMode: true,
  notifications: true,
  autoRefresh: true,
  refreshInterval: 30,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('bsi-preferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
    setMounted(true);
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('bsi-preferences', JSON.stringify(preferences));
    }
  }, [preferences, mounted]);

  // Apply dark mode to document
  useEffect(() => {
    if (mounted) {
      if (preferences.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [preferences.darkMode, mounted]);

  const addFavoriteTeam = (team: Team) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteTeams: [...prev.favoriteTeams.filter((t) => t.id !== team.id), team],
    }));
  };

  const removeFavoriteTeam = (teamId: string) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteTeams: prev.favoriteTeams.filter((t) => t.id !== teamId),
    }));
  };

  const toggleDarkMode = () => {
    setPreferences((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  const toggleNotifications = () => {
    setPreferences((prev) => ({
      ...prev,
      notifications: !prev.notifications,
    }));
  };

  const toggleAutoRefresh = () => {
    setPreferences((prev) => ({
      ...prev,
      autoRefresh: !prev.autoRefresh,
    }));
  };

  const setRefreshInterval = (interval: number) => {
    setPreferences((prev) => ({
      ...prev,
      refreshInterval: interval,
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('bsi-preferences');
  };

  if (!mounted) {
    return null; // or a loading state
  }

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        addFavoriteTeam,
        removeFavoriteTeam,
        toggleDarkMode,
        toggleNotifications,
        toggleAutoRefresh,
        setRefreshInterval,
        resetPreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
