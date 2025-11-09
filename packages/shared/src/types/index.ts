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
  broadcasters?: string[];
  probablePitchers?: {
    home?: PitcherInfo;
    away?: PitcherInfo;
  };
  linescore?: LinescoreSummary;
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

export interface PitcherInfo {
  name: string;
  throws?: string;
  wins?: number;
  losses?: number;
  era?: number;
}

export interface LinescoreSummary {
  currentInning?: number;
  inningState?: string;
  innings: Array<{
    number: number;
    home: number | null;
    away: number | null;
  }>;
  totals: {
    home: {
      runs: number;
      hits: number;
      errors: number;
    };
    away: {
      runs: number;
      hits: number;
      errors: number;
    };
  };
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
  boxScore?: {
    battingLines: BattingLine[];
    pitchingLines: PitchingLine[];
  };
}

export interface BattingLine {
  player: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
}

export interface PitchingLine {
  player: string;
  ip: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
}
