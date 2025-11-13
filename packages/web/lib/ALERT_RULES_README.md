# Alert Rules Framework

Automated notification system for NCAA Fusion Dashboard based on team metrics and game leverage.

## Overview

The Alert Rules Framework allows you to define conditions that trigger notifications when team performance metrics exceed thresholds. Alerts can be delivered via webhooks, email, SMS, or push notifications.

## Use Cases

- **Performance Monitoring**: Get notified when teams overperform or underperform statistical expectations
- **High-Stakes Games**: Alerts for critical leverage moments
- **Momentum Tracking**: Notifications for win/loss streaks
- **Scouting**: Alerts when tracked teams face ranked opponents
- **Research**: Automated data collection triggers for analysis

## Alert Conditions

| Condition | Description | Threshold Unit |
|-----------|-------------|----------------|
| `pythagorean_over` | Team outperforming expectations | Win differential |
| `pythagorean_under` | Team underperforming expectations | Win differential |
| `leverage_high` | High leverage game upcoming | Leverage index (0-10) |
| `leverage_critical` | Critical leverage game | Leverage index (0-10) |
| `win_streak` | Win streak length | Number of games |
| `loss_streak` | Loss streak length | Number of games |
| `efficiency_high` | High offensive/defensive efficiency | Points per game |
| `efficiency_low` | Low offensive/defensive efficiency | Points per game |
| `ranked_opponent` | Facing ranked opponent | Opponent rank # |
| `record_threshold` | Win percentage milestone | Percentage (0-1) |

## Priority Levels

- **Critical** 🚨 - Immediate attention required (e.g., leverage index 8.0+)
- **High** ⚠️ - Important events (e.g., top 10 opponent, 4-game loss streak)
- **Medium** 📊 - Notable but not urgent (e.g., 5-game win streak)
- **Low** ℹ️ - Informational (e.g., statistical milestones)

## Configuration

### Basic Rule Structure

```typescript
{
  id: 'unique-rule-id',
  name: 'Human-readable name',
  description: 'What triggers this alert',
  condition: 'pythagorean_over',
  threshold: 2.0,
  priority: 'high',
  enabled: true,
  channels: ['webhook', 'email'],
  webhookUrl: 'https://your-endpoint.com/alerts',
  cooldownMinutes: 1440 // 24 hours between alerts
}
```

### Targeting Specific Teams/Sports

```typescript
{
  // Alert only for Duke basketball
  sport: 'basketball',
  teamIds: ['150'],

  // Or alert for entire SEC conference
  conferences: ['SEC'],

  // Leave undefined to match all teams/sports
}
```

### Example: Monitor Duke's Performance

```typescript
const dukePythRule: AlertRule = {
  id: 'duke-pyth-watch',
  name: 'Duke Pythagorean Alert',
  description: 'Alert when Duke is 2+ wins over/under expectation',
  condition: 'pythagorean_over',
  threshold: 2.0,
  priority: 'high',
  enabled: true,
  sport: 'basketball',
  teamIds: ['150'], // Duke's ESPN team ID
  channels: ['webhook', 'email'],
  webhookUrl: 'https://myapp.com/webhooks/alerts',
  emailRecipients: ['scout@example.com'],
  cooldownMinutes: 1440
};
```

## Usage

### 1. Define Rules

Create your alert rules in `config/alert-rules.json`:

```bash
cp config/alert-rules.example.json config/alert-rules.json
```

Edit with your custom rules, webhook URLs, and email addresses.

### 2. Evaluate Metrics

```typescript
import {
  evaluateAllRules,
  DEFAULT_ALERT_RULES,
  type AlertEvaluationContext
} from '@/lib/alert-rules';

// Build context from fusion dashboard data
const context: AlertEvaluationContext = {
  actualWins: 15,
  expectedWins: 12.5,
  efficiencyDifferential: 8.3,
  streakValue: 4, // 4-game win streak
  winPercentage: 0.750,
  leverageIndex: 7.2,
  opponentRank: 8,
  teamId: '150',
  sport: 'basketball',
  conference: 'ACC'
};

// Evaluate against all rules
const matches = evaluateAllRules(DEFAULT_ALERT_RULES, context);

// Process matches
for (const match of matches) {
  console.log(`[${match.priority.toUpperCase()}] ${match.message}`);
  // Send to webhook, email, etc.
}
```

### 3. Integrate with Fusion Dashboard

The fusion dashboard already calculates all necessary metrics. To add alert evaluation:

```typescript
// In packages/web/app/college/fusion/page.tsx

import { evaluateAllRules, DEFAULT_ALERT_RULES } from '@/lib/alert-rules';

// After calculating leverageIndex...
const alertContext = {
  actualWins: overall.wins,
  expectedWins: pyth?.expectedWins ?? null,
  efficiencyDifferential: eff?.differential ?? null,
  streakValue: momentum?.streakValue ?? null,
  winPercentage: overall.wins / (overall.wins + overall.losses),
  leverageIndex: leverageIndex?.index ?? null,
  opponentRank: opponent?.rank ?? null,
  teamId: team.id,
  sport,
  conference: overall.scope.includes('conference') ? 'CONFERENCE_NAME' : undefined
};

const alertMatches = evaluateAllRules(DEFAULT_ALERT_RULES, alertContext);
// Display in UI or trigger notifications
```

## Delivery Channels

### Webhook

Send alerts to a webhook endpoint:

```typescript
const rule: AlertRule = {
  // ... other config
  channels: ['webhook'],
  webhookUrl: 'https://myapp.com/api/alerts',
};
```

**Webhook Payload:**
```json
{
  "ruleId": "duke-pyth-watch",
  "ruleName": "Duke Pythagorean Alert",
  "priority": "high",
  "message": "Team is outperforming expectation by 2.5 wins",
  "matchedValue": 2.5,
  "threshold": 2.0,
  "timestamp": "2025-11-13T10:30:00.000Z",
  "context": {
    "teamId": "150",
    "sport": "basketball",
    "actualWins": 15,
    "expectedWins": 12.5
  }
}
```

### Email

Send alerts via email:

```typescript
const rule: AlertRule = {
  // ... other config
  channels: ['email'],
  emailRecipients: ['alerts@example.com', 'scout@example.com']
};
```

### SMS (Future)

Send text message alerts:

```typescript
const rule: AlertRule = {
  // ... other config
  channels: ['sms']
};
```

### Push Notifications (Future)

Send push notifications to mobile apps.

## Rate Limiting

Prevent alert spam with cooldown periods:

```typescript
const rule: AlertRule = {
  // ... other config
  cooldownMinutes: 1440 // Don't re-alert for 24 hours
};
```

**Cooldown Behavior:**
- After an alert fires, the rule is suppressed for `cooldownMinutes`
- Prevents duplicate alerts for ongoing situations (e.g., win streak grows from 5 to 6)
- Cooldown resets when condition is no longer met

## Implementation with Cloudflare Workers

### Worker Structure

```javascript
// cloudflare-workers/ncaa-alerts/src/index.ts

import { evaluateAllRules } from './alert-rules';

export default {
  async scheduled(event, env, ctx) {
    // Cron trigger every 30 minutes

    // 1. Fetch data from fusion API
    const teams = ['150', '153', '333']; // Duke, UNC, Alabama
    for (const teamId of teams) {
      const response = await fetch(
        `${env.FUSION_API_URL}?sport=basketball&teamId=${teamId}`
      );
      const data = await response.json();

      // 2. Build alert context
      const context = buildContextFromFusion(data);

      // 3. Evaluate rules
      const matches = evaluateAllRules(loadRules(env), context);

      // 4. Deliver alerts
      for (const match of matches) {
        if (shouldSendAlert(match, env.KV)) {
          await deliverAlert(match, env);
          await recordAlertSent(match, env.KV);
        }
      }
    }
  }
};
```

### Deployment

```bash
# Create worker
cd cloudflare-workers/ncaa-alerts
npm install

# Set up cron trigger in wrangler.toml
[triggers]
crons = ["*/30 * * * *"]  # Every 30 minutes

# Deploy
wrangler deploy
```

## Examples

### Example 1: Duke Basketball Scout

Monitor Duke's season performance and alert on key moments:

```typescript
const dukeRules: AlertRule[] = [
  {
    id: 'duke-pyth-over',
    name: 'Duke Overperforming',
    description: 'Duke wins exceeding Pythagorean expectation',
    condition: 'pythagorean_over',
    threshold: 1.5,
    priority: 'medium',
    enabled: true,
    sport: 'basketball',
    teamIds: ['150'],
    channels: ['email'],
    emailRecipients: ['duke-scout@example.com'],
    cooldownMinutes: 2880 // 48 hours
  },
  {
    id: 'duke-ranked-opp',
    name: 'Duke vs Top 10',
    description: 'Duke facing top 10 opponent',
    condition: 'ranked_opponent',
    threshold: 10,
    priority: 'high',
    enabled: true,
    sport: 'basketball',
    teamIds: ['150'],
    channels: ['email', 'webhook'],
    webhookUrl: 'https://scout-app.com/api/alerts',
    cooldownMinutes: 1440
  }
];
```

### Example 2: Conference-Wide Monitoring

Alert on any SEC team with critical leverage games:

```typescript
const secLeverageRule: AlertRule = {
  id: 'sec-leverage',
  name: 'SEC Critical Games',
  description: 'High-stakes games across SEC conference',
  condition: 'leverage_critical',
  threshold: 8.0,
  priority: 'critical',
  enabled: true,
  sport: 'basketball',
  conferences: ['SEC'],
  channels: ['webhook'],
  webhookUrl: 'https://conference-tracker.com/alerts',
  cooldownMinutes: 360 // 6 hours
};
```

### Example 3: Multi-Sport Performance Tracking

Track efficiency across all sports:

```typescript
const efficiencyRules: AlertRule[] = [
  {
    id: 'elite-efficiency-basketball',
    name: 'Elite Basketball Efficiency',
    condition: 'efficiency_high',
    threshold: 12.0,
    priority: 'medium',
    enabled: true,
    sport: 'basketball',
    channels: ['webhook'],
    webhookUrl: 'https://analytics.com/alerts',
    cooldownMinutes: 1440
  },
  {
    id: 'elite-efficiency-football',
    name: 'Elite Football Efficiency',
    condition: 'efficiency_high',
    threshold: 15.0,
    priority: 'medium',
    enabled: true,
    sport: 'football',
    channels: ['webhook'],
    webhookUrl: 'https://analytics.com/alerts',
    cooldownMinutes: 1440
  }
];
```

## Testing

```typescript
import { evaluateRule } from '@/lib/alert-rules';

// Test a rule
const testContext = {
  actualWins: 20,
  expectedWins: 17.5,
  efficiencyDifferential: 9.2,
  streakValue: 6,
  winPercentage: 0.800,
  leverageIndex: 7.8,
  opponentRank: 5,
  teamId: '150',
  sport: 'basketball'
};

const testRule: AlertRule = {
  id: 'test',
  name: 'Test Rule',
  description: 'Test pythagorean overperformance',
  condition: 'pythagorean_over',
  threshold: 2.0,
  priority: 'high',
  enabled: true,
  channels: ['webhook']
};

const match = evaluateRule(testRule, testContext);
if (match) {
  console.log('✓ Alert triggered:', match.message);
} else {
  console.log('✗ No match');
}
```

## Future Enhancements

1. **Machine Learning Predictions**: Alert on predicted outcomes (e.g., "80% chance Duke wins")
2. **Historical Comparisons**: Alert when current metrics exceed historical best
3. **Betting Integrations**: Combine with line movements for value alerts
4. **Social Media**: Auto-post alerts to Twitter/Discord
5. **Dashboard Widget**: Display active alerts in fusion UI

## Related Files

- `packages/web/lib/alert-rules.ts` - Core framework
- `packages/web/config/alert-rules.example.json` - Example configuration
- `packages/web/lib/leverage-index.ts` - Leverage calculation (used by alerts)
- `packages/web/app/college/fusion/` - Fusion dashboard (data source)

## Support

Questions? Open an issue in the BSI-NextGen repo or contact the team.
