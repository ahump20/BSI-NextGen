// Blaze Trends Types

export interface Trend {
  id: string;
  sport: string;
  title: string;
  summary: string;
  context: string;
  keyPlayers: string[];
  teamIds: string[];
  significance: string;
  viralScore: number;
  sources: Source[];
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  url: string;
  title: string;
  publishedAt: string;
  sourceName: string;
}

export interface TrendsResponse {
  trends: Trend[];
  cached?: boolean;
}

export interface TrendResponse {
  trend: Trend;
  cached?: boolean;
}

export type SportType =
  | 'college_baseball'
  | 'mlb'
  | 'nfl'
  | 'college_football'
  | 'college_basketball'
  | 'all';

export const SPORT_LABELS: Record<SportType, string> = {
  all: 'All Sports',
  college_baseball: 'College Baseball',
  mlb: 'MLB',
  nfl: 'NFL',
  college_football: 'College Football',
  college_basketball: 'College Basketball',
};

export const SPORT_ICONS: Record<SportType, string> = {
  all: '🔥',
  college_baseball: '⚾',
  mlb: '⚾',
  nfl: '🏈',
  college_football: '🏈',
  college_basketball: '🏀',
};

export const SPORT_COLORS: Record<SportType, string> = {
  all: 'bg-gradient-to-r from-orange-500 to-red-600',
  college_baseball: 'bg-blue-600',
  mlb: 'bg-red-600',
  nfl: 'bg-green-600',
  college_football: 'bg-orange-600',
  college_basketball: 'bg-purple-600',
};
