/**
 * Homepage Intelligence Types
 *
 * Types for gamification, alerts, and performance metrics
 * displayed on the Blaze Sports Intel homepage
 */

/**
 * Alert Types
 */
export type AlertType = 'SHARP' | 'RECRUIT' | 'INJURY' | 'ALGO' | 'TREND' | 'NEWS';

export interface LiveAlert {
  id: string;
  type: AlertType;
  msg: string;
  time: string; // relative time (e.g., "2m", "1h")
  timestamp: string; // ISO 8601
  color: string; // Tailwind color class
  border: string; // Tailwind border class
  sport?: string;
  priority: 'high' | 'medium' | 'low';
  url?: string; // Optional link to detailed view
}

/**
 * User Stats & Gamification
 */
export interface UserStats {
  userId: string;
  rank: string; // e.g., "Varsity Scout", "All-American", "Hall of Famer"
  xp: number; // Current experience points
  nextLevel: number; // XP needed for next level
  streak: number; // Daily login streak
  achievements: Achievement[];
  level: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string; // ISO 8601
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * Performance & Analytics
 */
export interface WeeklyAlpha {
  totalUnits: number; // +/- units for the week
  winRate: number; // Percentage (0-100)
  sports: SportPerformance[];
  lastUpdated: string; // ISO 8601
  timezone: string; // America/Chicago
}

export interface SportPerformance {
  name: string; // e.g., "NCAA Baseball", "SEC Football"
  roi: number; // Return on investment percentage
  color: string; // Tailwind color class
  units: number; // +/- units
  picks: number; // Total picks made
  wins: number;
  losses: number;
}

/**
 * Podcast/Media Types
 */
export interface MediaContent {
  id: string;
  type: 'podcast' | 'article' | 'video';
  title: string;
  subtitle: string;
  description: string;
  author: string;
  thumbnail: string;
  publishedAt: string; // ISO 8601
  duration?: number; // seconds (for audio/video)
  url: string;
  tags: string[];
}

/**
 * Feature Card Types (for bento grid)
 */
export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string; // Icon name or component
  status: 'active' | 'locked' | 'coming_soon';
  tier: 'free' | 'pro' | 'elite';
  url?: string;
  gradientColors: string; // Tailwind gradient classes
}

/**
 * API Response Types
 */
export interface AlertsResponse {
  alerts: LiveAlert[];
  total: number;
  cached: boolean;
  lastUpdated: string;
}

export interface UserStatsResponse {
  stats: UserStats;
  cached: boolean;
  lastUpdated: string;
}

export interface WeeklyAlphaResponse {
  alpha: WeeklyAlpha;
  cached: boolean;
  lastUpdated: string;
}

export interface MediaResponse {
  media: MediaContent[];
  total: number;
  cached: boolean;
  lastUpdated: string;
}
