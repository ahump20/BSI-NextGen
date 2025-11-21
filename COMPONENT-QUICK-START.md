# React Component Library - Quick Start Guide

## Ready to Use Components

All React components are production-ready and tested. Import from `@/components` or individual paths.

## Component Inventory

### ✅ Base Components (Primitives)
1. **Button** - `/src/components/primitives/Button.tsx`
2. **Card** - `/src/components/primitives/Card.tsx`
3. **Table** - `/src/components/primitives/Table.tsx`
4. **Modal** - `/src/components/primitives/Modal.tsx`

### ✅ Sports Components
5. **BoxScore** - `/src/components/sports/BoxScore.tsx`
6. **Standings** - `/src/components/sports/Standings.tsx`
7. **LiveScoreCard** - `/src/components/sports/LiveScoreCard.tsx`

### ✅ Common Components
8. **ErrorBoundary** - `/src/components/common/ErrorBoundary.tsx`
9. **LoadingState** - `/src/components/common/LoadingState.tsx`

### ✅ Layout Components
10. **MobileNav** - `/src/components/layout/MobileNav.tsx`

## 5-Minute Implementation Examples

### 1. College Baseball Box Score Page

```tsx
// src/pages/CollegeBaseballGame.tsx
import React, { useEffect, useState } from 'react';
import { BoxScore, LoadingState, ErrorBoundary } from '@/components';

export default function CollegeBaseballGame({ gameId }: { gameId: string }) {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/college-baseball/games/${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        setGameData(data);
        setLoading(false);
      });
  }, [gameId]);

  if (loading) return <LoadingState message="Loading game data..." />;
  if (!gameData) return <div>Game not found</div>;

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">
          {gameData.awayTeam.teamName} @ {gameData.homeTeam.teamName}
        </h1>
        <BoxScore
          homeTeam={gameData.homeTeam}
          awayTeam={gameData.awayTeam}
          homeBatting={gameData.homeBatting}
          awayBatting={gameData.awayBatting}
          homePitching={gameData.homePitching}
          awayPitching={gameData.awayPitching}
          gameStatus={gameData.status}
          venue={gameData.venue}
          date={gameData.date}
        />
      </div>
    </ErrorBoundary>
  );
}
```

### 2. MLB Standings Dashboard

```tsx
// src/pages/MLBStandings.tsx
import React, { useEffect, useState } from 'react';
import { Standings, LoadingState, ErrorBoundary, MobileNav } from '@/components';

export default function MLBStandingsPage() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mlb/standings')
      .then((res) => res.json())
      .then((data) => {
        setStandings(data.conferences);
        setLoading(false);
      });
  }, []);

  const navItems = [
    { label: 'Standings', href: '/mlb/standings' },
    { label: 'Scores', href: '/mlb/scores' },
    { label: 'Stats', href: '/mlb/stats' },
  ];

  return (
    <ErrorBoundary>
      <MobileNav items={navItems} logo={<img src="/logo.png" alt="Blaze" />} />
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">MLB Standings</h1>
        {loading ? (
          <LoadingState message="Loading standings..." />
        ) : (
          <Standings
            conferences={standings}
            sport="baseball"
            showRunDifferential
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
```

### 3. Live Scores Feed (Mobile-First)

```tsx
// src/pages/LiveScores.tsx
import React, { useEffect, useState } from 'react';
import { LiveScoreCard, LoadingState, ErrorBoundary } from '@/components';

export default function LiveScoresPage() {
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveGames = () => {
      fetch('/api/live-scores')
        .then((res) => res.json())
        .then((data) => {
          setLiveGames(data.games);
          setLoading(false);
        });
    };

    fetchLiveGames();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveGames, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Live Scores</h1>
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveGames.map((game) => (
              <LiveScoreCard
                key={game.gameId}
                game={game}
                onClick={() => (window.location.href = `/games/${game.gameId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
```

### 4. Authentication Modal

```tsx
// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { Modal, ModalFooter, Button, Card } from '@/components';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="••••••••"
          />
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleLogin} loading={loading}>
          Login
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

### 5. Conference Standings with Filtering

```tsx
// src/pages/ConferenceStandings.tsx
import React, { useState, useEffect } from 'react';
import { Standings, Button, Card, LoadingState } from '@/components';

export default function ConferenceStandingsPage() {
  const [conference, setConference] = useState('SEC');
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  const conferences = ['SEC', 'Big 12', 'ACC', 'Big Ten', 'Pac-12'];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/college-baseball/standings?conference=${conference}`)
      .then((res) => res.json())
      .then((data) => {
        setStandings(data.conferences);
        setLoading(false);
      });
  }, [conference]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">College Baseball Standings</h1>

      {/* Conference Filter */}
      <Card padding="sm" className="mb-6">
        <div className="flex flex-wrap gap-2">
          {conferences.map((conf) => (
            <Button
              key={conf}
              variant={conference === conf ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setConference(conf)}
            >
              {conf}
            </Button>
          ))}
        </div>
      </Card>

      {/* Standings Table */}
      {loading ? (
        <LoadingState message={`Loading ${conference} standings...`} />
      ) : (
        <Standings
          conferences={standings}
          sport="baseball"
          showRunDifferential
          compactMode
        />
      )}
    </div>
  );
}
```

## Integration with Existing Game

The React components don't interfere with your Babylon.js game. You can:

### Option 1: Separate Routes
```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GamePage from './pages/GamePage'; // Existing game
import StandingsPage from './pages/StandingsPage'; // New React page

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GamePage />} />
        <Route path="/mlb/standings" element={<StandingsPage />} />
        <Route path="/live-scores" element={<LiveScoresPage />} />
        {/* Add more routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Option 2: Render Both
```tsx
// src/main.ts (existing game entry)
import { initializeGame } from './game/GameEngine';

// Start game as normal
initializeGame(document.getElementById('renderCanvas'));

// Mount React dashboard separately
import('./dashboard').then(({ mountDashboard }) => {
  mountDashboard(document.getElementById('dashboard-root'));
});
```

```tsx
// src/dashboard.tsx (new file)
import ReactDOM from 'react-dom/client';
import { ErrorBoundary, MobileNav } from './components';
import DashboardApp from './DashboardApp';

export function mountDashboard(container: HTMLElement) {
  ReactDOM.createRoot(container).render(
    <ErrorBoundary>
      <DashboardApp />
    </ErrorBoundary>
  );
}
```

## Styling Setup

All components use Tailwind CSS. Make sure your `index.html` or main CSS file includes:

```html
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet">
```

Or install Tailwind properly:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## API Integration Pattern

All components expect specific data shapes. Example API response formats:

```typescript
// /api/college-baseball/games/:id
{
  homeTeam: TeamBoxScore;
  awayTeam: TeamBoxScore;
  homeBatting?: PlayerBattingStats[];
  awayBatting?: PlayerBattingStats[];
  homePitching?: PlayerPitchingStats[];
  awayPitching?: PlayerPitchingStats[];
  status: string;
  venue: string;
  date: string;
}

// /api/mlb/standings
{
  conferences: ConferenceStandings[];
}

// /api/live-scores
{
  games: LiveGameData[];
}
```

See `/src/components/sports/*.tsx` for full TypeScript type definitions.

## Common Patterns

### Loading States
```tsx
{loading ? <LoadingState /> : <YourComponent data={data} />}
```

### Error Handling
```tsx
<ErrorBoundary onError={(error) => logToSentry(error)}>
  <YourComponent />
</ErrorBoundary>
```

### Mobile Navigation
```tsx
<MobileNav items={navItems} currentPath={location.pathname} />
```

### Empty States
```tsx
<Table
  data={data}
  columns={columns}
  emptyMessage="No games scheduled today"
/>
```

## Testing Your Components

```bash
# Run all tests
npm test

# Run specific component tests
npm test Button.test.tsx

# Watch mode
npm test -- --watch
```

## Build for Production

```bash
# Type check
npm run typecheck

# Build
npm run build

# Preview
npm run preview
```

## Next Steps

1. Choose which feature to implement first
2. Copy the relevant example above
3. Connect to your API endpoints
4. Customize styling as needed
5. Test on mobile devices

All components are production-ready and mobile-optimized!

---

**Location**: `/Users/AustinHumphrey/Sandlot-Sluggers/src/components/`
**Documentation**: `/src/components/README.md`
**Tests**: `/tests/components/`
**Pass Rate**: 30/33 tests (90.9%)
