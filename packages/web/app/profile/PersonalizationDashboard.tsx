'use client';

import { useEffect, useState } from 'react';
import { analytics } from '@bsi/shared';
import type { AuthUser } from '@bsi/shared';
import { useAuth } from '@/lib/hooks/useAuth';

interface AlertPreference {
  id: string;
  label: string;
  channel: 'email' | 'sms' | 'in-app';
}

interface PersonalizationPayload {
  favorites: string[];
  watchlist: string[];
  alerts: AlertPreference[];
}

const EMPTY_STATE: PersonalizationPayload = {
  favorites: [],
  watchlist: [],
  alerts: [],
};

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
      {label}
    </span>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
  );
}

function EditorRow({
  value,
  onChange,
  placeholder,
  onSave,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  onSave: () => void;
}) {
  return (
    <div className="flex gap-2 mt-3">
      <input
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        onClick={onSave}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add
      </button>
    </div>
  );
}

export function PersonalizationDashboard({ user }: { user: AuthUser }) {
  const { login, sessionStatus } = useAuth();
  const [state, setState] = useState<PersonalizationPayload>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteInput, setFavoriteInput] = useState('');
  const [watchInput, setWatchInput] = useState('');
  const [alertInput, setAlertInput] = useState('');

  const fetchState = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/personalization', {
        credentials: 'include',
      });

      if (response.status === 401) {
        setError('Your session expired. Please sign in again to sync your dashboard.');
        return;
      }

      const data = await response.json();
      setState(data.personalization || EMPTY_STATE);
    } catch (err) {
      setError('Could not load personalization.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistState = async (nextState: PersonalizationPayload, action: string) => {
    try {
      setState(nextState);
      const response = await fetch('/api/user/personalization', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      analytics.track('personalization_update', {
        action,
        userId: user.id,
        featureFlags: user.featureFlags,
      });
    } catch (err) {
      setError('Unable to save changes. Please retry.');
    }
  };

  const addFavorite = () => {
    if (!favoriteInput.trim()) return;
    const next = {
      ...state,
      favorites: [...state.favorites, favoriteInput.trim()],
    };
    setFavoriteInput('');
    persistState(next, 'favorite_add');
  };

  const addWatch = () => {
    if (!watchInput.trim()) return;
    const next = {
      ...state,
      watchlist: [...state.watchlist, watchInput.trim()],
    };
    setWatchInput('');
    persistState(next, 'watchlist_add');
  };

  const addAlert = () => {
    if (!alertInput.trim()) return;
    const next = {
      ...state,
      alerts: [
        ...state.alerts,
        { id: crypto.randomUUID(), label: alertInput.trim(), channel: 'in-app' as const },
      ],
    };
    setAlertInput('');
    persistState(next, 'alert_add');
  };

  const removeItem = (collection: 'favorites' | 'watchlist' | 'alerts', id: string) => {
    const next = {
      ...state,
      [collection]: state[collection].filter((item: any) => {
        if (collection === 'alerts') {
          return (item as AlertPreference).id !== id;
        }
        return item !== id;
      }),
    } as PersonalizationPayload;

    persistState(next, `${collection}_remove`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">Loading your personalized dashboard...</p>
      </div>
    );
  }

  if (sessionStatus === 'expired') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-700 mb-4">
          Your session expired. Sign back in to keep your favorites, watchlists, and alerts synced.
        </p>
        <button
          onClick={() => login('/profile')}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Sign back in
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personalized Command Center</h2>
          <p className="text-sm text-gray-600">
            Favorites, watchlists, and alerts stay tied to your entitlements.
          </p>
        </div>
        <div className="flex gap-2">
          <Pill label="Role-aware" />
          <Pill label="Session protected" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-100 rounded-xl p-4">
          <SectionTitle
            title="Favorites"
            subtitle="Pin your go-to dashboards and routes"
          />
          <div className="flex flex-wrap gap-2">
            {state.favorites.map((fav) => (
              <Pill key={fav} label={fav} />
            ))}
          </div>
          <EditorRow
            value={favoriteInput}
            onChange={setFavoriteInput}
            placeholder="Add favorite (e.g. College Baseball)"
            onSave={addFavorite}
          />
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <SectionTitle title="Watchlists" subtitle="Track games and prospects" />
          <div className="flex flex-wrap gap-2">
            {state.watchlist.map((entry) => (
              <Pill key={entry} label={entry} />
            ))}
          </div>
          <EditorRow
            value={watchInput}
            onChange={setWatchInput}
            placeholder="Add watchlist item (e.g. LSU vs Florida)"
            onSave={addWatch}
          />
        </div>

        <div className="border border-gray-100 rounded-xl p-4">
          <SectionTitle title="Alerts" subtitle="Get notified when action hits" />
          <div className="space-y-2">
            {state.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{alert.label}</p>
                  <p className="text-xs text-gray-600">{alert.channel}</p>
                </div>
                <button
                  onClick={() => removeItem('alerts', alert.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <EditorRow
            value={alertInput}
            onChange={setAlertInput}
            placeholder="Add alert (e.g. Pitching change)"
            onSave={addAlert}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <div>
          Session is refreshed silently. If your session goes stale we preserve unsaved edits and prompt you to re-authenticate.
        </div>
        <div className="flex items-center gap-2 text-blue-700">
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          Session health
        </div>
      </div>
    </div>
  );
}
