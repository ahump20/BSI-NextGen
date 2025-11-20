/**
 * D1 Database Types
 *
 * Type definitions for querying Cloudflare D1 from Next.js
 */

export type GameRecord = {
  id: string;
  sport: string;
  league: string;
  game_date: string;
  game_time: string | null;
  season: number | null;
  week: number | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  status: string;
  period: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamRecord = {
  id: string;
  sport: string;
  name: string;
  display_name: string;
  abbreviation: string;
  city: string | null;
  logo_url: string | null;
  conference: string | null;
  division: string | null;
  is_active: number;
  metadata: string | null;
  created_at: string;
  updated_at: string;
};

export type StandingRecord = {
  id: number;
  sport: string;
  season: number;
  team_id: string;
  wins: number;
  losses: number;
  ties: number;
  conference: string | null;
  division: string | null;
  win_percentage: number | null;
  games_back: number | null;
  points_for: number | null;
  points_against: number | null;
  streak: string | null;
  conference_rank: number | null;
  division_rank: number | null;
  metadata: string | null;
  snapshot_date: string;
  created_at: string;
};

export type NewsArticle = {
  id: number;
  title: string;
  url: string;
  description: string | null;
  content: string | null;
  source_name: string;
  author: string | null;
  sport: string | null;
  teams: string | null;
  keywords: string | null;
  published_at: string;
  scraped_at: string;
  content_hash: string | null;
  image_url: string | null;
  metadata: string | null;
  created_at: string;
};

export type IngestionLogRecord = {
  id: number;
  job_type: string;
  sport: string | null;
  status: string;
  records_processed: number;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
  error_details: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  metadata: string | null;
};

/**
 * View types (from SQL views)
 */
export type RecentGameView = {
  id: string;
  sport: string;
  league: string;
  game_date: string;
  game_time: string | null;
  status: string;
  home_score: number;
  away_score: number;
  home_team_name: string;
  home_team_abbr: string;
  home_team_logo: string | null;
  away_team_name: string;
  away_team_abbr: string;
  away_team_logo: string | null;
  venue_name: string | null;
  period: string | null;
};

export type LiveGameView = {
  id: string;
  sport: string;
  league: string;
  game_date: string;
  status: string;
  period: string | null;
  home_score: number;
  away_score: number;
  home_team_name: string;
  home_team_abbr: string;
  away_team_name: string;
  away_team_abbr: string;
  venue_name: string | null;
};

export type LatestStandingsView = {
  sport: string;
  season: number;
  conference: string | null;
  division: string | null;
  team_name: string;
  team_abbr: string;
  team_logo: string | null;
  wins: number;
  losses: number;
  ties: number;
  win_percentage: number | null;
  games_back: number | null;
  streak: string | null;
  conference_rank: number | null;
  division_rank: number | null;
};
