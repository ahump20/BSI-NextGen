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
  boxScore?: EnhancedBoxScore;
  recap?: string;
  preview?: string;
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

// Play-by-play types for enhanced game coverage
export interface PlayByPlay {
  inning: number;
  halfInning: 'top' | 'bottom';
  outs: number;
  plays: Play[];
}

export interface Play {
  id: string;
  description: string;
  timestamp: string;
  batter: string;
  pitcher: string;
  result: string;
  runsScored: number;
  rbi?: number;
}

// Enhanced box score with play-by-play
export interface EnhancedBoxScore {
  battingLines: BattingLine[];
  pitchingLines: PitchingLine[];
  playByPlay?: PlayByPlay[];
  inningScores?: InningScore[];
}

export interface InningScore {
  inning: number;
  homeScore: number;
  awayScore: number;
}

// D1Baseball Rankings
export interface D1BaseballRanking {
  rank: number;
  team: string;
  conference: string;
  record: string;
  wins: number;
  losses: number;
  previousRank?: number;
  trend?: 'up' | 'down' | 'same';
}

export interface ConferenceStanding {
  team: string;
  conferenceRecord: string;
  overallRecord: string;
  conferenceWins: number;
  conferenceLosses: number;
  overallWins: number;
  overallLosses: number;
  winPercentage: number;
  streak?: string;
}

// MLB Enhanced Types
export interface MLBGame extends Game {
  sport: 'MLB';
  boxScore?: MLBBoxScore;
  playByPlay?: MLBPlayByPlay[];
}

export interface MLBBoxScore {
  teams: {
    home: MLBTeamStats;
    away: MLBTeamStats;
  };
  players: {
    home: MLBPlayerStats[];
    away: MLBPlayerStats[];
  };
  linescore: MLBInningScore[];
}

export interface MLBTeamStats {
  team: Team;
  teamStats: {
    hits: number;
    runs: number;
    errors: number;
    leftOnBase: number;
  };
}

export interface MLBPlayerStats {
  player: Player;
  position: string;
  battingStats?: {
    atBats: number;
    runs: number;
    hits: number;
    rbi: number;
    walks: number;
    strikeouts: number;
    avg: number;
  };
  pitchingStats?: {
    inningsPitched: number;
    hits: number;
    runs: number;
    earnedRuns: number;
    walks: number;
    strikeouts: number;
    era: number;
    pitchCount: number;
  };
}

export interface MLBInningScore {
  inning: number;
  home: number;
  away: number;
}

export interface MLBPlayByPlay {
  inning: number;
  halfInning: 'top' | 'bottom';
  events: MLBPlayEvent[];
}

export interface MLBPlayEvent {
  id: string;
  description: string;
  result: string;
  batter: string;
  pitcher: string;
  runners?: string[];
  outs: number;
  runsScored: number;
}
