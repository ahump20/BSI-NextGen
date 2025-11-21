# Blaze Sports Intel - React Component Library

Production-ready React components for building sports intelligence dashboards and features.

## Overview

This component library is designed to coexist with the existing Babylon.js game while providing a robust foundation for building sports data dashboards, box scores, standings tables, and live score displays.

## Component Categories

### Primitives (`/primitives`)

Base UI components that form the foundation of the design system:

- **Button**: Fully accessible button with variants, sizes, loading states, and icons
- **Card**: Flexible card container with header, content, and footer sections
- **Table**: Sortable, responsive data table with loading and empty states
- **Modal**: Accessible modal dialog with keyboard navigation

### Sports Components (`/sports`)

Specialized components for displaying sports data:

- **BoxScore**: Complete baseball box score with line scores, batting, and pitching stats
- **Standings**: Conference/division standings with sortable columns and expandable sections
- **LiveScoreCard**: Real-time game score card with sport-specific details (baseball diamond, football down/distance)

### Common Components (`/common`)

Utility components used throughout the application:

- **ErrorBoundary**: React error boundary with fallback UI and error reporting
- **LoadingState**: Loading spinners and skeleton loaders for async content
- **SkeletonLoader**: Animated loading placeholders
- **TableSkeleton**: Pre-configured table skeleton
- **CardSkeleton**: Pre-configured card skeleton

### Layout Components (`/layout`)

Page structure and navigation components:

- **MobileNav**: Mobile-first responsive navigation with expandable sections and desktop support

## Installation & Setup

The component library is already configured in this project. To use components:

```tsx
import { Button, Card, BoxScore, ErrorBoundary } from '@/components';
```

## Usage Examples

### Button

```tsx
import { Button } from '@/components';

// Basic usage
<Button>Click Me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="danger">Delete</Button>
<Button variant="outline">Cancel</Button>

// With loading state
<Button loading>Saving...</Button>

// With icon
<Button icon={<Icon />}>With Icon</Button>

// Full width on mobile
<Button fullWidth>Full Width</Button>
```

### Box Score

```tsx
import { BoxScore } from '@/components';

const homeTeam = {
  teamName: 'Cardinals',
  innings: [
    { inning: 1, runs: 0 },
    { inning: 2, runs: 2 },
    // ... through inning 9
  ],
  runs: 7,
  hits: 12,
  errors: 1,
};

const awayTeam = {
  teamName: 'Cubs',
  innings: [
    { inning: 1, runs: 1 },
    // ... through inning 9
  ],
  runs: 4,
  hits: 8,
  errors: 2,
};

const battingStats = [
  {
    name: 'Paul Goldschmidt',
    position: '1B',
    atBats: 4,
    runs: 2,
    hits: 3,
    rbi: 2,
    walks: 1,
    strikeouts: 0,
    average: '.315',
  },
  // ... more players
];

<BoxScore
  homeTeam={homeTeam}
  awayTeam={awayTeam}
  homeBatting={battingStats}
  gameStatus="Final"
  venue="Busch Stadium"
  date="November 7, 2025"
/>;
```

### Standings

```tsx
import { Standings } from '@/components';

const conferences = [
  {
    conferenceName: 'National League',
    divisions: [
      {
        divisionName: 'NL Central',
        teams: [
          {
            rank: 1,
            teamName: 'St. Louis Cardinals',
            wins: 95,
            losses: 67,
            winPercentage: '.586',
            gamesBack: '-',
            homeRecord: '52-29',
            awayRecord: '43-38',
            lastTen: '7-3',
            streak: 'W3',
            runDifferential: 127,
          },
          // ... more teams
        ],
      },
    ],
  },
];

<Standings
  conferences={conferences}
  sport="baseball"
  showRunDifferential
/>;
```

### Live Score Card

```tsx
import { LiveScoreCard } from '@/components';

const liveGame = {
  gameId: 'mlb-2025-11-07-stl-chc',
  status: 'live',
  sport: 'baseball',
  homeTeam: {
    name: 'St. Louis Cardinals',
    shortName: 'STL',
    score: 7,
    record: '95-67',
  },
  awayTeam: {
    name: 'Chicago Cubs',
    shortName: 'CHC',
    score: 4,
    record: '83-79',
  },
  gameInfo: {
    period: 'Bottom 9th',
    venue: 'Busch Stadium',
    broadcast: 'ESPN',
  },
  baseballSpecific: {
    inning: 9,
    isTop: false,
    outs: 2,
    balls: 1,
    strikes: 2,
    basesOccupied: [true, false, true], // 1st and 3rd
  },
};

<LiveScoreCard game={liveGame} onClick={() => goToGameDetail()} />;
```

### Error Boundary

```tsx
import { ErrorBoundary } from '@/components';

<ErrorBoundary
  fallback={<div>Custom error message</div>}
  onError={(error, errorInfo) => {
    console.error('Error caught:', error);
  }}
>
  <YourComponent />
</ErrorBoundary>;
```

### Mobile Navigation

```tsx
import { MobileNav } from '@/components';

const navItems = [
  {
    label: 'MLB',
    icon: '⚾',
    children: [
      { label: 'Standings', href: '/mlb/standings' },
      { label: 'Scores', href: '/mlb/scores' },
      { label: 'Stats', href: '/mlb/stats' },
    ],
  },
  {
    label: 'NFL',
    icon: '🏈',
    href: '/nfl',
  },
  {
    label: 'College Baseball',
    icon: '🎓',
    badge: 5, // Show badge with count
    href: '/college-baseball',
  },
];

<MobileNav
  items={navItems}
  logo={<img src="/logo.png" alt="Blaze" />}
  currentPath="/mlb/standings"
/>;
```

## Styling

All components use Tailwind CSS utility classes for styling. The design system follows these principles:

- **Mobile-first**: All components are responsive and optimized for mobile devices
- **Accessibility**: WCAG AA compliant with proper ARIA labels and keyboard navigation
- **Performance**: Optimized rendering with React.memo where appropriate
- **Consistency**: Unified color palette, spacing, and typography

### Color Palette

- Primary: Blue-600 (`#2563eb`)
- Danger: Red-600 (`#dc2626`)
- Success: Green-600 (`#16a34a`)
- Gray scale: Gray-50 through Gray-900

## Testing

All components have comprehensive test coverage using Vitest and Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests in UI mode
npm run test:ui
```

## TypeScript Support

All components are fully typed with TypeScript. Import types as needed:

```tsx
import type { ButtonProps, TeamStanding, LiveGameData } from '@/components';
```

## Accessibility Features

- All interactive elements are keyboard accessible
- Proper ARIA labels and roles
- Focus management in modals
- Color contrast meets WCAG AA standards
- Screen reader optimized tables

## Performance Considerations

- Components use React.forwardRef for proper ref forwarding
- Table component memoizes sorted data to prevent unnecessary re-renders
- Loading states prevent layout shift
- Lazy loading support via code splitting

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- iOS Safari (last 2 versions)
- Chrome Android (last 2 versions)

## Future Enhancements

Planned additions to the component library:

1. **AuthModal**: Login/signup modal with form validation
2. **PlayerCard**: Individual player stat cards
3. **GamePreview**: Pre-game matchup analysis component
4. **StatComparison**: Side-by-side player/team comparison
5. **Timeline**: Game event timeline component
6. **Charts**: Data visualization components (line, bar, radar charts)

## Contributing

When adding new components:

1. Create component in appropriate category folder
2. Add TypeScript types
3. Write comprehensive tests
4. Add to index.ts for exports
5. Update this README with usage examples
6. Ensure mobile responsiveness
7. Verify accessibility with keyboard navigation

## Component Architecture

```
src/components/
├── primitives/        # Base UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Table.tsx
│   ├── Modal.tsx
│   └── index.ts
├── sports/            # Sports-specific components
│   ├── BoxScore.tsx
│   ├── Standings.tsx
│   ├── LiveScoreCard.tsx
│   └── index.ts
├── common/            # Utility components
│   ├── ErrorBoundary.tsx
│   ├── LoadingState.tsx
│   └── index.ts
├── layout/            # Layout & navigation
│   ├── MobileNav.tsx
│   └── index.ts
└── index.ts           # Main export file
```

## Integration with Babylon.js Game

The React components are designed to coexist with the existing Babylon.js game. The game runs in a `<canvas>` element while React components can be rendered in separate DOM elements or as overlays.

### Example: Rendering React Dashboard Alongside Game

```tsx
import ReactDOM from 'react-dom/client';
import { ErrorBoundary, MobileNav } from './components';
import { DashboardApp } from './DashboardApp';

// Game continues to run in #renderCanvas
const gameCanvas = document.getElementById('renderCanvas');

// Mount React app in a separate container
const dashboardRoot = document.createElement('div');
dashboardRoot.id = 'dashboard-root';
document.body.appendChild(dashboardRoot);

ReactDOM.createRoot(dashboardRoot).render(
  <ErrorBoundary>
    <DashboardApp />
  </ErrorBoundary>
);
```

## License

Internal use - Blaze Sports Intelligence Platform
