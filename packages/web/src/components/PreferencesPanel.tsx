'use client';

import { useState } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';

export function PreferencesPanel() {
  const {
    preferences,
    toggleDarkMode,
    toggleNotifications,
    toggleAutoRefresh,
    setRefreshInterval,
    addFavoriteTeam,
    removeFavoriteTeam,
    resetPreferences,
  } = usePreferences();

  const [isOpen, setIsOpen] = useState(false);
  const [showTeamSearch, setShowTeamSearch] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');

  // Sample teams for search (in production, this would come from API)
  const availableTeams = [
    { id: 'texas', name: 'Texas Longhorns', sport: 'College Baseball' },
    { id: 'lsu', name: 'LSU Tigers', sport: 'College Baseball' },
    { id: 'arkansas', name: 'Arkansas Razorbacks', sport: 'College Baseball' },
    { id: 'oklahoma', name: 'Oklahoma Sooners', sport: 'College Baseball' },
    { id: 'yankees', name: 'New York Yankees', sport: 'MLB' },
    { id: 'dodgers', name: 'Los Angeles Dodgers', sport: 'MLB' },
  ];

  const filteredTeams = availableTeams.filter(
    (team) =>
      team.name.toLowerCase().includes(teamSearch.toLowerCase()) &&
      !preferences.favoriteTeams.some((fav) => fav.id === team.id)
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Open Preferences"
      >
        <span className="text-xl">⚙️</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-gray-900 rounded-lg shadow-2xl border border-gray-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>⚙️</span>
                <span>Preferences</span>
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Appearance */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>🎨</span>
                <span>Appearance</span>
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Dark Mode</div>
                    <div className="text-sm text-gray-400">Use dark theme across the site</div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.darkMode ? 'bg-orange-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>🔔</span>
                <span>Notifications</span>
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Enable Notifications</div>
                    <div className="text-sm text-gray-400">
                      Get alerts for live games and score changes
                    </div>
                  </div>
                  <button
                    onClick={toggleNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.notifications ? 'bg-orange-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Auto Refresh */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>🔄</span>
                <span>Auto Refresh</span>
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Auto Refresh Scores</div>
                    <div className="text-sm text-gray-400">
                      Automatically refresh live game scores
                    </div>
                  </div>
                  <button
                    onClick={toggleAutoRefresh}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.autoRefresh ? 'bg-orange-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {preferences.autoRefresh && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Refresh Interval: {preferences.refreshInterval} seconds
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="10"
                      value={preferences.refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10s</span>
                      <span>30s</span>
                      <span>60s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Teams */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>⭐</span>
                <span>Favorite Teams</span>
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                {preferences.favoriteTeams.length === 0 ? (
                  <p className="text-sm text-gray-400">No favorite teams yet</p>
                ) : (
                  <div className="space-y-2">
                    {preferences.favoriteTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-white">{team.name}</div>
                          <div className="text-sm text-gray-400">{team.sport}</div>
                        </div>
                        <button
                          onClick={() => removeFavoriteTeam(team.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowTeamSearch(!showTeamSearch)}
                  className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  + Add Favorite Team
                </button>

                {showTeamSearch && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Search teams..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                    />
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                      {filteredTeams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => {
                            addFavoriteTeam(team);
                            setTeamSearch('');
                          }}
                          className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-gray-400">{team.sport}</div>
                        </button>
                      ))}
                      {filteredTeams.length === 0 && teamSearch && (
                        <p className="text-sm text-gray-400 px-3 py-2">No teams found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-800 rounded-b-lg border-t border-gray-700 flex items-center justify-between">
            <button
              onClick={resetPreferences}
              className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
