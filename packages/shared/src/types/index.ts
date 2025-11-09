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

// NCAA College Baseball Types (enhanced box scores)
export interface NCAAGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: string;
    detail: string;
    completed: boolean;
    inning: number;
    inningHalf: 'top' | 'bottom';
  };
  teams: {
    home: NCAATeam;
    away: NCAATeam;
  };
  venue: {
    name: string;
    city: string;
    state: string;
  };
}

export interface NCAATeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  score: number;
  record: string;
  conference: string;
}

export interface NCAABoxScore {
  gameId: string;
  status: {
    type: string;
    detail: string;
    completed: boolean;
    inning: number;
    inningHalf: 'top' | 'bottom';
  };
  teams: {
    home: NCAATeam;
    away: NCAATeam;
  };
  batting: {
    home: BattingLine[];
    away: BattingLine[];
  };
  pitching: {
    home: PitchingLine[];
    away: PitchingLine[];
  };
  teamStats: {
    home: TeamStats;
    away: TeamStats;
  };
  venue: {
    name: string;
    city: string;
    state: string;
  };
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

export interface BattingLine {
  name: string;
  position: string;
  atBats: number;
  runs: number;
  hits: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  avg: string;
}

export interface PitchingLine {
  name: string;
  decision: string;
  inningsPitched: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  era: string;
}

export interface TeamStats {
  runs: number;
  hits: number;
  errors: number;
  leftOnBase: number;
}

// D1Baseball Rankings & Standings Types
export interface D1BaseballRanking {
  rank: number;
  team: {
    id: string;
    school: string;
    conference: string;
    logo: string;
  };
  record: {
    overall: string;
    conference: string;
    wins: number;
    losses: number;
  };
  previousRank: number;
  rankMovement: 'up' | 'down' | 'same' | 'new';
  firstPlaceVotes: number;
  points: number;
}

export interface ConferenceStandings {
  conference: string;
  teams: ConferenceTeam[];
  lastUpdated: string;
  dataSource: string;
}

export interface ConferenceTeam {
  id: string;
  school: string;
  logo: string;
  record: {
    overall: string;
    conference: string;
    wins: number;
    losses: number;
    conferenceWins: number;
    conferenceLosses: number;
    winPercentage: number;
    conferenceWinPercentage: number;
  };
  stats: {
    runsScored: number;
    runsAllowed: number;
    homeRecord: string;
    awayRecord: string;
    streak: string;
  };
}
