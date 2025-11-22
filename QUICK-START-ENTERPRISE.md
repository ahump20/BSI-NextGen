# 🚀 Quick Start: Enterprise Analytics Dashboard

## 5-Minute Integration Guide

### Step 1: View the Enhanced Dashboard

```bash
# Navigate to the new enterprise analytics page
# Start your dev server
pnpm dev

# Open in browser
http://localhost:3000/analytics/enterprise
```

### Step 2: Try Key Features

#### Natural Language Queries

1. Click anywhere in the dashboard
2. Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
3. Type a query:
   - "Show me all QBs"
   - "Compare Ohtani vs Judge"
   - "Top 5 by WAR"
   - "Predict next season"

#### AI Predictions

1. Click any athlete card
2. Scroll to "AI-Powered Predictions" section
3. See:
   - Next game forecast
   - Confidence intervals
   - SHAP feature importance
   - Risk factors
   - Recommendations

#### Export Data

1. Press `⌘K` to open command palette
2. Select "Export to PDF" (or Excel/CSV)
3. File downloads automatically

#### Real-Time Updates

1. Look for the Play/Pause button in top navigation
2. Green = Live updates ON
3. Gray = Updates paused

## 10-Minute Custom Integration

### Use in Your Own Page

```typescript
// app/my-analytics/page.tsx
import EnhancedCommandCenter from '@/components/enterprise/EnhancedCommandCenter';

export default function MyAnalyticsPage() {
  return <EnhancedCommandCenter />;
}
```

### With Custom Data

```typescript
// Modify EnhancedCommandCenter.tsx to accept props
interface Props {
  initialAssets?: Asset[];
}

export default function EnhancedCommandCenter({ initialAssets }: Props) {
  const [assets] = useState<Asset[]>(initialAssets || ASSETS);
  // ... rest of component
}

// Then use it:
import EnhancedCommandCenter from '@/components/enterprise/EnhancedCommandCenter';

const myAthletes = await fetch('/api/my-athletes').then(r => r.json());

<EnhancedCommandCenter initialAssets={myAthletes} />
```

### Add Natural Language Query to Existing Component

```typescript
import NaturalLanguageQuery from '@/components/enterprise/NaturalLanguageQuery';

function MyDashboard() {
  const [athletes, setAthletes] = useState([...]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Your existing content */}
      <div>
        <AthleteList athletes={athletes} />
      </div>

      {/* Add NLP query panel */}
      <div>
        <NaturalLanguageQuery
          dataset={athletes}
          onQueryResult={(result) => {
            // Update athletes based on query
            setAthletes(result.data);
          }}
        />
      </div>
    </div>
  );
}
```

### Add AI Predictions to Your Data

```typescript
import { PredictionEngine } from '@/lib/ai/PredictionEngine';

// Initialize prediction engine
const engine = new PredictionEngine([
  'power', 'contact', 'speed', 'fielding', 'arm'
]);

// Train with your historical data (one time)
await engine.train({
  features: [
    [99, 92, 94, 85, 98], // Ohtani
    [100, 88, 65, 82, 90], // Judge
    // ... more training data
  ],
  targets: [9.2, 10.8, ...] // WAR values
});

// Generate predictions for new athlete
const prediction = engine.predict({
  historicalData: [45, 90, 96, 100, 98],
  currentMetrics: {
    WAR: 9.2,
    HR: 54,
    AVG: 0.310,
    OPS: 1.036
  },
  contextualFactors: {
    age: 29,
    experience: 7,
    recentForm: [98, 95, 100, 92, 96],
    injuryHistory: 2
  }
});

console.log('Predicted WAR:', prediction.predictions.seasonEnd);
console.log('Confidence:', prediction.confidence);
console.log('Top feature:', Object.entries(prediction.shapValues)
  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]);
```

### Add Export Functionality

```typescript
import { exportDashboard } from '@/lib/utils/exportUtils';

function MyComponent() {
  const handleExport = async () => {
    await exportDashboard({
      athletes: filteredAthletes,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'Analytics Team',
        dashboardVersion: '9.0'
      }
    }, {
      format: 'pdf', // or 'excel', 'csv', 'json'
      filename: 'my-report.pdf',
      includeCharts: true,
      includeMetadata: true
    });
  };

  return (
    <button onClick={handleExport}>
      Export to PDF
    </button>
  );
}
```

### Add Real-Time Data

```typescript
import { useLiveGameData } from '@/lib/hooks/useRealTimeData';

function LiveGameDashboard() {
  const { data, isConnected, lastUpdate, error } = useLiveGameData('mlb_game_123');

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <StatusBadge connected={isConnected} />

      {data && (
        <div>
          <h2>Score: {data.homeScore} - {data.awayScore}</h2>
          <p>Last updated: {lastUpdate?.toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
}
```

## Common Customizations

### Change Theme Colors

```typescript
// In EnhancedCommandCenter.tsx

// Find and modify these values:
const theme = {
  primary: '#f97316',    // Orange → Change to your brand color
  secondary: '#8b5cf6',  // Purple → Change to your accent color
  // ...
};

// Update all instances of:
// - 'bg-orange-500' → 'bg-blue-500'
// - 'text-orange-400' → 'text-blue-400'
// - 'border-orange-500' → 'border-blue-500'
// etc.
```

### Add Custom Metrics

```typescript
// Modify ASSETS array to include your custom metrics
const CUSTOM_ASSETS = ASSETS.map(athlete => ({
  ...athlete,
  metrics: {
    ...athlete.metrics,
    // Add your custom metrics
    CUSTOM_SCORE: calculateCustomScore(athlete),
    TEAM_IMPACT: calculateTeamImpact(athlete),
    TRADE_VALUE: calculateTradeValue(athlete)
  }
}));
```

### Add Custom Alerts

```typescript
// In EnhancedCommandCenter.tsx, add to useEffect:

useEffect(() => {
  const customAlerts: Alert[] = [];

  assets.forEach(asset => {
    // Custom alert: MVP candidate
    if (asset.metrics.WAR > 8 && asset.sport === 'baseball') {
      customAlerts.push({
        id: `mvp_${asset.id}`,
        type: 'success',
        message: `${asset.name}: MVP candidate (WAR ${asset.metrics.WAR})`,
        timestamp: Date.now(),
        assetId: asset.id
      });
    }

    // Custom alert: Contract year
    if (asset.contract.includes('Rookie') || asset.contract.includes('Arb')) {
      customAlerts.push({
        id: `contract_${asset.id}`,
        type: 'info',
        message: `${asset.name}: Contract year - high motivation`,
        timestamp: Date.now(),
        assetId: asset.id
      });
    }
  });

  setAlerts(prev => [...prev, ...customAlerts]);
}, [assets]);
```

### Add Custom Query Types

```typescript
// In NaturalLanguageQuery.tsx, modify parseQuery function:

const parseQuery = useCallback(async (query: string): Promise<QueryIntent> => {
  // ... existing code ...

  // Add custom intent detection
  if (lowerQuery.includes('value') || lowerQuery.includes('contract')) {
    type = 'value'; // Custom type
  }

  return { type, entities, metrics, operators, timeframe, confidence };
}, [dataset]);

// Then handle in executeQuery:
case 'value':
  // Your custom logic
  data = data.map(athlete => ({
    ...athlete,
    valueScore: calculateValue(athlete)
  }));
  explanation = 'Calculated player values based on performance and contract';
  break;
```

## Testing Your Integration

### 1. Component Test

```typescript
// __tests__/enterprise-dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import EnhancedCommandCenter from '@/components/enterprise/EnhancedCommandCenter';

test('renders dashboard with athletes', () => {
  render(<EnhancedCommandCenter />);

  // Check that athletes are displayed
  expect(screen.getByText('Shohei Ohtani')).toBeInTheDocument();
  expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
});

test('search filters athletes', async () => {
  const { user } = render(<EnhancedCommandCenter />);

  const search = screen.getByPlaceholderText(/search/i);
  await user.type(search, 'Ohtani');

  expect(screen.getByText('Shohei Ohtani')).toBeInTheDocument();
  expect(screen.queryByText('Patrick Mahomes')).not.toBeInTheDocument();
});
```

### 2. AI Prediction Test

```typescript
import { PredictionEngine } from '@/lib/ai/PredictionEngine';

test('generates predictions with confidence', () => {
  const engine = new PredictionEngine(['power', 'contact', 'speed']);

  const prediction = engine.predict({
    historicalData: [90, 92, 95, 98, 100],
    currentMetrics: { WAR: 9.2, HR: 54, AVG: 0.310 },
    contextualFactors: {
      age: 29,
      experience: 7,
      recentForm: [98, 95, 100],
      injuryHistory: 2
    }
  });

  expect(prediction.predictions.nextGame).toBeGreaterThan(0);
  expect(prediction.confidence.level).toBe(0.95);
  expect(prediction.shapValues).toBeDefined();
});
```

### 3. Export Test

```typescript
import { exportToCSV } from '@/lib/utils/exportUtils';

test('exports to CSV format', async () => {
  const data = {
    athletes: [
      {
        name: 'Test Player',
        team: 'Test Team',
        sport: 'baseball',
        metrics: { WAR: 5.0, HR: 30 }
      }
    ]
  };

  const blob = await exportToCSV(data, { format: 'csv' });

  expect(blob.type).toBe('text/csv;charset=utf-8;');
  expect(blob.size).toBeGreaterThan(0);
});
```

## Troubleshooting

### Issue: "Module not found"
**Solution:** Ensure all imports use correct paths:
```typescript
// Correct
import EnhancedCommandCenter from '@/components/enterprise/EnhancedCommandCenter';

// Incorrect
import EnhancedCommandCenter from '../components/enterprise/EnhancedCommandCenter';
```

### Issue: "WebSocket connection failed"
**Solution:** Check your WebSocket server is running and URL is correct:
```typescript
// Use correct protocol (ws:// for http, wss:// for https)
const wsUrl = process.env.NODE_ENV === 'production'
  ? 'wss://api.blazesportsintel.com/live'
  : 'ws://localhost:8080/live';
```

### Issue: "Predictions are inaccurate"
**Solution:** Train model with more data:
```typescript
// Need at least 100 samples for good accuracy
const trainingData = {
  features: [], // Array of [metric1, metric2, ...] arrays
  targets: []   // Corresponding target values
};

// More data = better predictions
if (trainingData.features.length < 100) {
  console.warn('Need more training data for accurate predictions');
}
```

### Issue: "Export not working"
**Solution:** Check browser permissions:
```typescript
// Test clipboard access
const canCopy = await navigator.permissions.query({ name: 'clipboard-write' });
console.log('Clipboard permission:', canCopy.state);

// Test download capability
if (!document.createElement('a').download) {
  console.error('Browser does not support downloads');
}
```

## Next Steps

1. ✅ Review the full guide: `ENTERPRISE-ANALYTICS-GUIDE.md`
2. ✅ Read the upgrade summary: `ENTERPRISE-UPGRADE-SUMMARY.md`
3. ✅ Explore the code in `components/enterprise/`
4. ✅ Check out AI utilities in `lib/ai/`
5. ✅ Review hooks in `lib/hooks/`
6. ✅ Customize for your needs
7. ✅ Deploy to production

## Support

- **Documentation:** All markdown files in root
- **Code Examples:** `packages/web/app/analytics/enterprise/`
- **Type Definitions:** See inline JSDoc comments
- **Best Practices:** See `ENTERPRISE-ANALYTICS-GUIDE.md`

## Resources

### Research & Articles
- [AI Dashboards Enterprise Guide](https://www.thoughtspot.com/data-trends/dashboard/ai-dashboard)
- [Machine Learning in Sports](https://www.catapult.com/blog/sports-analytics-machine-learning)
- [NBA Prediction with XGBoost](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0307478)

### Tools & Libraries
- [Recharts Documentation](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Ready to build world-class analytics?** 🚀

Start with: `pnpm dev` → Open `http://localhost:3000/analytics/enterprise`
