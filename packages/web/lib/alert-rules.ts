/**
 * Alert Rules Framework for NCAA Fusion Dashboard
 *
 * Defines conditions that trigger alerts based on team metrics and game leverage.
 * This framework can be consumed by Cloudflare Workers or other notification systems.
 */

export type AlertCondition =
  | 'pythagorean_over'  // Outperforming expectation by X wins
  | 'pythagorean_under' // Underperforming expectation by X wins
  | 'leverage_high'     // Leverage index >= threshold
  | 'leverage_critical' // Leverage index >= 8.0
  | 'win_streak'        // Win streak >= X
  | 'loss_streak'       // Loss streak >= X
  | 'efficiency_high'   // Efficiency differential >= threshold
  | 'efficiency_low'    // Efficiency differential <= threshold
  | 'ranked_opponent'   // Opponent ranked in top X
  | 'record_threshold'; // Win percentage >= threshold

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export type AlertChannel = 'email' | 'webhook' | 'sms' | 'push';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  threshold: number;
  priority: AlertPriority;
  enabled: boolean;

  // Targeting
  sport?: 'basketball' | 'football' | 'baseball'; // undefined = all sports
  teamIds?: string[]; // undefined = all teams
  conferences?: string[]; // undefined = all conferences

  // Delivery
  channels: AlertChannel[];
  webhookUrl?: string;
  emailRecipients?: string[];

  // Rate limiting
  cooldownMinutes?: number; // Min time between alerts for this rule
}

export interface AlertRuleMatch {
  rule: AlertRule;
  matchedValue: number;
  exceededBy: number;
  message: string;
  priority: AlertPriority;
  timestamp: string;
}

/**
 * Example alert rules configuration
 */
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'pyth-overperform-2',
    name: 'Pythagorean Overperformance (+2 wins)',
    description: 'Team is outperforming statistical expectations by 2+ wins',
    condition: 'pythagorean_over',
    threshold: 2.0,
    priority: 'high',
    enabled: true,
    channels: ['webhook'],
    cooldownMinutes: 60
  },
  {
    id: 'pyth-underperform-2',
    name: 'Pythagorean Underperformance (-2 wins)',
    description: 'Team is underperforming statistical expectations by 2+ wins',
    condition: 'pythagorean_under',
    threshold: 2.0,
    priority: 'medium',
    enabled: true,
    channels: ['webhook'],
    cooldownMinutes: 60
  },
  {
    id: 'leverage-critical',
    name: 'Critical Leverage Game',
    description: 'Upcoming game has critical leverage (8.0+)',
    condition: 'leverage_critical',
    threshold: 8.0,
    priority: 'critical',
    enabled: true,
    channels: ['webhook', 'email'],
    cooldownMinutes: 1440 // 24 hours
  },
  {
    id: 'leverage-high',
    name: 'High Leverage Game',
    description: 'Upcoming game has high leverage (6.5+)',
    condition: 'leverage_high',
    threshold: 6.5,
    priority: 'high',
    enabled: true,
    channels: ['webhook'],
    cooldownMinutes: 720 // 12 hours
  },
  {
    id: 'win-streak-5',
    name: '5-Game Win Streak',
    description: 'Team has won 5 or more games in a row',
    condition: 'win_streak',
    threshold: 5,
    priority: 'medium',
    enabled: true,
    channels: ['webhook'],
    cooldownMinutes: 1440
  },
  {
    id: 'loss-streak-4',
    name: '4-Game Loss Streak',
    description: 'Team has lost 4 or more games in a row',
    condition: 'loss_streak',
    threshold: 4,
    priority: 'high',
    enabled: true,
    channels: ['webhook', 'email'],
    cooldownMinutes: 720
  },
  {
    id: 'efficiency-elite',
    name: 'Elite Efficiency Differential',
    description: 'Team has efficiency differential of +10 or higher',
    condition: 'efficiency_high',
    threshold: 10.0,
    priority: 'medium',
    enabled: true,
    channels: ['webhook'],
    cooldownMinutes: 1440
  },
  {
    id: 'ranked-opponent-top10',
    name: 'Top 10 Opponent',
    description: 'Upcoming opponent is ranked in top 10',
    condition: 'ranked_opponent',
    threshold: 10,
    priority: 'high',
    enabled: true,
    channels: ['webhook'],
    cooldownMinutes: 1440
  }
];

/**
 * Evaluate metrics against alert rules
 */
export interface AlertEvaluationContext {
  // Team metrics
  actualWins: number;
  expectedWins: number | null;
  efficiencyDifferential: number | null;
  streakValue: number | null; // Positive for wins, negative for losses
  winPercentage: number;

  // Game context
  leverageIndex: number | null;
  opponentRank: number | null;

  // Team identification
  teamId: string;
  sport: string;
  conference?: string;
}

/**
 * Check if a metric meets a rule's condition
 */
export function evaluateRule(
  rule: AlertRule,
  context: AlertEvaluationContext
): AlertRuleMatch | null {
  if (!rule.enabled) return null;

  // Check sport filter
  if (rule.sport && rule.sport !== context.sport.toLowerCase()) {
    return null;
  }

  // Check team filter
  if (rule.teamIds && !rule.teamIds.includes(context.teamId)) {
    return null;
  }

  // Check conference filter
  if (rule.conferences && context.conference && !rule.conferences.includes(context.conference)) {
    return null;
  }

  let matchedValue: number | null = null;
  let message: string = '';

  switch (rule.condition) {
    case 'pythagorean_over':
      if (context.expectedWins !== null) {
        const diff = context.actualWins - context.expectedWins;
        if (diff >= rule.threshold) {
          matchedValue = diff;
          message = `Team is outperforming expectation by ${diff.toFixed(1)} wins (actual: ${context.actualWins}, expected: ${context.expectedWins.toFixed(1)})`;
        }
      }
      break;

    case 'pythagorean_under':
      if (context.expectedWins !== null) {
        const diff = context.expectedWins - context.actualWins;
        if (diff >= rule.threshold) {
          matchedValue = diff;
          message = `Team is underperforming expectation by ${diff.toFixed(1)} wins (actual: ${context.actualWins}, expected: ${context.expectedWins.toFixed(1)})`;
        }
      }
      break;

    case 'leverage_critical':
      if (context.leverageIndex !== null && context.leverageIndex >= 8.0) {
        matchedValue = context.leverageIndex;
        message = `Critical leverage game detected (index: ${context.leverageIndex.toFixed(1)}/10)`;
      }
      break;

    case 'leverage_high':
      if (context.leverageIndex !== null && context.leverageIndex >= rule.threshold) {
        matchedValue = context.leverageIndex;
        message = `High leverage game detected (index: ${context.leverageIndex.toFixed(1)}/10)`;
      }
      break;

    case 'win_streak':
      if (context.streakValue !== null && context.streakValue >= rule.threshold) {
        matchedValue = context.streakValue;
        message = `${context.streakValue}-game win streak active`;
      }
      break;

    case 'loss_streak':
      if (context.streakValue !== null && context.streakValue <= -rule.threshold) {
        matchedValue = Math.abs(context.streakValue);
        message = `${Math.abs(context.streakValue)}-game loss streak active`;
      }
      break;

    case 'efficiency_high':
      if (context.efficiencyDifferential !== null && context.efficiencyDifferential >= rule.threshold) {
        matchedValue = context.efficiencyDifferential;
        message = `Elite efficiency differential: +${context.efficiencyDifferential.toFixed(1)} points per game`;
      }
      break;

    case 'efficiency_low':
      if (context.efficiencyDifferential !== null && context.efficiencyDifferential <= -rule.threshold) {
        matchedValue = context.efficiencyDifferential;
        message = `Poor efficiency differential: ${context.efficiencyDifferential.toFixed(1)} points per game`;
      }
      break;

    case 'ranked_opponent':
      if (context.opponentRank !== null && context.opponentRank <= rule.threshold) {
        matchedValue = context.opponentRank;
        message = `Facing ranked opponent: #${context.opponentRank}`;
      }
      break;

    case 'record_threshold':
      if (context.winPercentage >= rule.threshold) {
        matchedValue = context.winPercentage;
        message = `Win percentage reached: ${(context.winPercentage * 100).toFixed(1)}%`;
      }
      break;
  }

  if (matchedValue !== null) {
    const exceededBy = matchedValue - rule.threshold;
    return {
      rule,
      matchedValue,
      exceededBy,
      message,
      priority: rule.priority,
      timestamp: new Date().toISOString()
    };
  }

  return null;
}

/**
 * Evaluate all rules against context
 */
export function evaluateAllRules(
  rules: AlertRule[],
  context: AlertEvaluationContext
): AlertRuleMatch[] {
  return rules
    .map((rule) => evaluateRule(rule, context))
    .filter((match): match is AlertRuleMatch => match !== null)
    .sort((a, b) => {
      // Sort by priority (critical > high > medium > low)
      const priorityOrder: Record<AlertPriority, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

/**
 * Format alert match for display or notification
 */
export function formatAlertMatch(match: AlertRuleMatch): string {
  const priorityEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '📊',
    low: 'ℹ️'
  };

  return `${priorityEmoji[match.priority]} ${match.rule.name}\n${match.message}`;
}
