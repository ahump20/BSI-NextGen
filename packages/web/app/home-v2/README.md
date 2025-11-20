# Blaze Sports Intel Homepage V2

## Overview

Enhanced homepage for blazesportsintel.com with full back-end integration, gamification, and real-time data feeds.

## Features

### 🎨 Visual Design
- **Interactive Particle Background**: HTML5 Canvas-based StarField with mouse interaction
- **Burnt Orange Branding**: Texas-inspired color scheme (#BF5700)
- **Bento Grid Layout**: Modern card-based interface
- **Mobile-First**: Fully responsive across all devices
- **Smooth Animations**: 60fps transitions and hover effects

### 🎮 Gamification
- **User Stats Dashboard**: XP, levels, and rank progression
- **Daily Streak Counter**: Encourages daily engagement
- **Achievement System**: Unlockable badges and rewards
- **Progress Bars**: Visual feedback for advancement

### 📊 Real-Time Data
- **Live Alerts Feed**: Betting line movements, injuries, recruiting news
- **Weekly Performance Metrics**: ROI tracking by sport
- **Auto-Refresh**: Keeps data current without page reload
- **Caching Strategy**: Optimized for performance

### 🏗️ Architecture

```
app/home-v2/
├── page.tsx                      # Main homepage component
└── README.md                     # This file

components/homepage/
├── index.ts                      # Barrel exports
├── StarField.tsx                 # Interactive background
├── GamifiedNavbar.tsx            # Navigation with user stats
├── LiveWire.tsx                  # Real-time alerts feed
└── PerformanceCard.tsx           # Weekly alpha metrics

app/api/homepage/
├── alerts/route.ts               # Live alerts endpoint
├── user-stats/route.ts           # User gamification data
└── weekly-alpha/route.ts         # Performance metrics

packages/shared/src/types/
└── homepage.ts                   # TypeScript type definitions
```

## Components

### StarField
Interactive particle-based background using HTML5 Canvas.

**Features:**
- 150 animated particles
- Mouse/touch interaction with connecting lines
- Orange/grey color scheme
- Performance-optimized with requestAnimationFrame

**Usage:**
```tsx
import { StarField } from '@/components/homepage';

<div className="relative">
  <StarField />
  {/* Your content */}
</div>
```

### GamifiedNavbar
Navigation bar with user stats and gamification elements.

**Features:**
- User rank display
- XP progress bar
- Daily streak counter
- Responsive mobile menu
- Auto-refreshing stats

**Usage:**
```tsx
import { GamifiedNavbar } from '@/components/homepage';

<GamifiedNavbar />
```

### LiveWire
Real-time alerts and notifications feed.

**Props:**
- `maxAlerts?: number` - Maximum alerts to display (default: 10)
- `autoRefresh?: boolean` - Enable auto-refresh (default: true)
- `refreshInterval?: number` - Refresh interval in ms (default: 60000)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { LiveWire } from '@/components/homepage';

<LiveWire
  maxAlerts={15}
  autoRefresh={true}
  refreshInterval={30000}
/>
```

### PerformanceCard
Weekly performance metrics display.

**Props:**
- `className?: string` - Additional CSS classes
- `autoRefresh?: boolean` - Enable auto-refresh (default: true)
- `refreshInterval?: number` - Refresh interval in ms (default: 300000)

**Usage:**
```tsx
import { PerformanceCard } from '@/components/homepage';

<PerformanceCard autoRefresh={true} />
```

## API Routes

### GET /api/homepage/alerts

Fetches live alerts and notifications.

**Query Parameters:**
- `limit` (number): Maximum alerts to return (default: 10)
- `sport` (string): Filter by sport (optional)

**Response:**
```typescript
{
  alerts: LiveAlert[],
  total: number,
  cached: boolean,
  lastUpdated: string
}
```

**Caching:** Browser 1 min, CDN 5 min

### GET /api/homepage/user-stats

Fetches user gamification stats.

**Query Parameters:**
- `userId` (string): User ID (defaults to current user)

**Response:**
```typescript
{
  stats: {
    userId: string,
    rank: string,
    xp: number,
    nextLevel: number,
    streak: number,
    achievements: Achievement[],
    level: number
  },
  cached: boolean,
  lastUpdated: string
}
```

**Caching:** Private, 5 min

### POST /api/homepage/user-stats

Updates user stats (increment XP, update streak, unlock achievements).

**Body:**
```typescript
{
  action: 'increment_xp' | 'update_streak' | 'unlock_achievement',
  value: number | string
}
```

### GET /api/homepage/weekly-alpha

Fetches weekly performance metrics.

**Query Parameters:**
- `weeks` (number): Number of weeks to include (default: 1)

**Response:**
```typescript
{
  alpha: {
    totalUnits: number,
    winRate: number,
    sports: SportPerformance[],
    lastUpdated: string,
    timezone: string
  },
  cached: boolean,
  lastUpdated: string
}
```

**Caching:** Browser 10 min, CDN 30 min

### POST /api/homepage/weekly-alpha

Records a new pick result.

**Body:**
```typescript
{
  sport: string,
  result: 'win' | 'loss' | 'push',
  units: number,
  confidence: number // 1-10
}
```

## TypeScript Types

All types are exported from `@bsi/shared`:

```typescript
import type {
  LiveAlert,
  AlertType,
  UserStats,
  Achievement,
  WeeklyAlpha,
  SportPerformance,
  AlertsResponse,
  UserStatsResponse,
  WeeklyAlphaResponse,
} from '@bsi/shared';
```

See `packages/shared/src/types/homepage.ts` for full type definitions.

## Styling

### Custom CSS Classes

Added to `globals.css`:

```css
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { ... }

/* Text Shadow */
.text-shadow { ... }

/* 3D Perspective */
.perspective-1000 { ... }
.rotate-y-0 { ... }
.rotate-y-[-10deg] { ... }
```

### Color Scheme

- **Primary Orange**: `#BF5700` (Burnt Orange)
- **Background**: `zinc-950` to `black`
- **Accents**: `sky-400`, `green-400`, `red-400`

## Development

### Building

```bash
# Build shared package (required for types)
pnpm --filter @bsi/shared build

# Start development server
pnpm dev
```

### Testing

```bash
# Visit the new homepage
http://localhost:3000/home-v2

# Test API endpoints
curl http://localhost:3000/api/homepage/alerts
curl http://localhost:3000/api/homepage/user-stats
curl http://localhost:3000/api/homepage/weekly-alpha
```

## Deployment Checklist

Before deploying to production:

1. ✅ Build shared package: `pnpm --filter @bsi/shared build`
2. ✅ Test all API routes
3. ✅ Verify responsive design on mobile/tablet/desktop
4. ✅ Check loading states and error handling
5. ✅ Test auto-refresh functionality
6. ✅ Validate caching strategy
7. ⬜ Connect to real Blaze Trends worker (update `BLAZE_TRENDS_URL` env var)
8. ⬜ Integrate with actual user authentication
9. ⬜ Connect to analytics database for real performance data
10. ⬜ Set up monitoring and alerts

## Environment Variables

Optional:
```bash
# Blaze Trends Worker URL
BLAZE_TRENDS_URL=https://blaze-trends.austinhumphrey.workers.dev
```

## Performance

- **Lighthouse Score Target**: 90+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Canvas FPS**: 60fps stable

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Future Enhancements

- [ ] WebSocket integration for real-time alerts
- [ ] Push notifications for high-priority alerts
- [ ] Social features (leaderboards, friend challenges)
- [ ] Advanced analytics dashboard
- [ ] Customizable alert preferences
- [ ] Multi-language support
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts

## Notes

- All timestamps use `America/Chicago` timezone
- API responses are cached with appropriate TTLs
- Components handle loading and error states gracefully
- Mobile-first responsive design principles
- Accessibility features included (ARIA labels, keyboard navigation)

## Contact

For questions or issues:
- GitHub: https://github.com/ahump20/BSI-NextGen
- Documentation: See CLAUDE.md in project root
