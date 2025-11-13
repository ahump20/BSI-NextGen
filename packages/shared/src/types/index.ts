/**
 * Blaze Sports Intel - Shared Type Definitions
 * Sports: Baseball → Football → Basketball → Track & Field
 * Timezone: America/Chicago
 */

export type Sport = 'MLB' | 'NFL' | 'NBA' | 'NCAA_FOOTBALL' | 'COLLEGE_BASEBALL' | 'TRACK_FIELD';

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  logo?: string;
  conference?: string;
  division?: string;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  jersey?: string;
}

export interface Game {
  id: string;
  sport: Sport;
  date: string; // ISO 8601 in America/Chicago
  status: GameStatus;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  period?: string;
  venue?: string;
}

export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled';

export interface Standing {
  team: Team;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack?: number;
  streak?: string;
  lastTen?: string;
}

export interface MLBStats {
  batting: {
    average: number;
    homeRuns: number;
    rbi: number;
    hits: number;
    atBats: number;
  };
  pitching: {
    era: number;
    wins: number;
    losses: number;
    strikeouts: number;
    innings: number;
  };
}

export interface NFLStats {
  passing: {
    yards: number;
    touchdowns: number;
    interceptions: number;
    completions: number;
    attempts: number;
  };
  rushing: {
    yards: number;
    touchdowns: number;
    carries: number;
  };
}

export interface NBAStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fieldGoalPercentage: number;
}

export interface DataSource {
  provider: string;
  timestamp: string; // ISO 8601 in America/Chicago
  confidence: number; // 0-1
}

export interface ApiResponse<T> {
  data: T;
  source: DataSource;
  error?: string;
}

export interface CacheConfig {
  ttl: number; // seconds
  key: string;
  refresh?: boolean;
}

// College Baseball specific (ESPN gap filler)
export interface CollegeBaseballGame extends Game {
  sport: 'COLLEGE_BASEBALL';
  conference: string;
  linescore?: LinescoreFrame[];
  boxScore?: CollegeBaseballBoxScore;
}

export interface LinescoreFrame {
  inning: string;
  home: number;
  away: number;
}

export interface CollegeBaseballBoxScore {
  batting: Record<'home' | 'away', BattingLine[]>;
  pitching: Record<'home' | 'away', PitchingLine[]>;
  scoringPlays: ScoringPlay[];
  lastUpdated: string;
}

export interface BattingLine {
  player: string;
  team: 'home' | 'away';
  position?: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
}

export interface PitchingLine {
  player: string;
  team: 'home' | 'away';
  decision?: 'W' | 'L' | 'SV' | null;
  ip: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
}

export interface ScoringPlay {
  inning: number;
  halfInning: 'Top' | 'Bottom';
  description: string;
  scoringTeam: 'home' | 'away';
  awayScore: number;
  homeScore: number;
  outs?: number;
}
