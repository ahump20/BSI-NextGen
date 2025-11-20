/**
 * Moment Mentality Index (MMI) TypeScript Types
 *
 * These types correspond to the Python package data models
 * for seamless integration between the MMI service and BSI frontend.
 *
 * @see mmi-package/mmi/models.py for Python source definitions
 */

/**
 * Base state enum matching Python BaseState
 */
export enum BaseState {
  EMPTY = '___',
  FIRST = '1__',
  SECOND = '_2_',
  THIRD = '__3',
  FIRST_SECOND = '12_',
  FIRST_THIRD = '1_3',
  SECOND_THIRD = '_23',
  LOADED = '123',
}

/**
 * Complete MMI component breakdown for a single pitch
 */
export interface MMIComponents {
  /** Raw leverage index (0-10 typical range) */
  leverage_index: number;
  /** Raw pressure score (0-30 typical range) */
  pressure_score: number;
  /** Raw fatigue score (0-50 typical range) */
  fatigue_score: number;
  /** Raw execution difficulty score (0-25 typical range) */
  execution_score: number;
  /** Raw bio-proxy stress score (0-15 typical range) */
  bio_proxies_score: number;

  /** Z-normalized leverage index */
  li_z: number;
  /** Z-normalized pressure score */
  pressure_z: number;
  /** Z-normalized fatigue score */
  fatigue_z: number;
  /** Z-normalized execution score */
  execution_z: number;
  /** Z-normalized bio-proxies score */
  bio_z: number;

  /** Final weighted MMI value */
  mmi: number;
}

/**
 * Complete pitch data with MMI metrics
 */
export interface PitchMMI extends MMIComponents {
  /** MLB game ID */
  game_id: string;
  /** Game date (ISO 8601) */
  date: string;
  /** Inning number (1-20 for extra innings) */
  inning: number;
  /** True if top of inning */
  is_top_inning: boolean;

  /** Pitcher MLB ID */
  pitcher_id: number;
  /** Pitcher full name */
  pitcher_name: string;
  /** Pitcher hand (L/R) */
  pitcher_hand?: 'L' | 'R';

  /** Batter MLB ID */
  batter_id: number;
  /** Batter full name */
  batter_name: string;
  /** Batter hand (L/R) */
  batter_hand?: 'L' | 'R';

  /** Number of outs (0-2) */
  outs: number;
  /** Ball count (0-3) */
  balls: number;
  /** Strike count (0-2) */
  strikes: number;

  /** Base state (e.g., "___", "1__", "123") */
  base_state: string;
  /** Score differential (positive = home winning) */
  score_diff: number;

  /** Pitch velocity in mph (null if unavailable) */
  pitch_velocity: number | null;
  /** Pitch type (e.g., "FF", "SL", "CH") */
  pitch_type?: string;

  /** Win probability before pitch (0-1) */
  wp_before?: number;
  /** Win probability after pitch (0-1) */
  wp_after?: number;
}

/**
 * Player-level MMI summary statistics
 */
export interface PlayerMMISummary {
  /** Player MLB ID */
  player_id: number;
  /** Player full name */
  player_name: string;
  /** Role in analysis (pitcher or batter) */
  role: 'pitcher' | 'batter';

  /** Number of events (pitches or PAs) */
  count: number;
  /** Mean MMI across all events */
  mean_mmi: number;
  /** Median MMI */
  median_mmi: number;
  /** 90th percentile MMI */
  p90_mmi: number;
  /** Maximum MMI encountered */
  max_mmi: number;

  /** Number of high-leverage events (MMI > 2.0) */
  high_mmi_count: number;

  /** Standard deviation of MMI */
  std_mmi?: number;
  /** 75th percentile MMI */
  p75_mmi?: number;
  /** 95th percentile MMI */
  p95_mmi?: number;
}

/**
 * Response metadata
 */
export interface MMIMetadata {
  /** Data source identifier */
  dataSource: string;
  /** Last update timestamp (ISO 8601) */
  lastUpdated: string;
  /** Timezone (always America/Chicago) */
  timezone: string;
  /** API version */
  apiVersion: string;
  /** Total pitch count in response */
  pitchCount: number;
  /** Season year */
  season?: number;
}

/**
 * Complete game MMI response
 */
export interface GameMMIResponse {
  /** MLB game ID */
  game_id: string;
  /** Season year */
  season: number;
  /** All pitches with MMI calculations */
  pitches: PitchMMI[];
  /** Player-level summary statistics */
  player_summaries: PlayerMMISummary[];
  /** Response metadata */
  meta: MMIMetadata;
}

/**
 * High-MMI moment with context
 */
export interface HighMMIMoment extends PitchMMI {
  /** Rank in high-MMI search (1 = highest) */
  rank: number;
  /** Contextual description */
  context: {
    /** Inning description (e.g., "Bottom 9th, 2 outs") */
    inning_description: string;
    /** Situation description (e.g., "Bases loaded, down 1") */
    situation: string;
    /** Pitch outcome (e.g., "Strikeout (game over)") */
    outcome: string | null;
  };
}

/**
 * High-MMI search response
 */
export interface HighMMISearchResponse {
  /** Array of high-MMI moments */
  moments: HighMMIMoment[];
  /** Search parameters used */
  params: {
    threshold: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    teamId?: string;
  };
  /** Response metadata */
  meta: MMIMetadata;
}

/**
 * Player season MMI summary
 */
export interface PlayerSeasonMMI {
  /** Player MLB ID */
  player_id: number;
  /** Player full name */
  player_name: string;
  /** Season year */
  season: number;
  /** Role in analysis */
  role: 'pitcher' | 'batter';

  /** Total events (pitches or PAs) */
  total_events: number;
  /** Games played */
  games: number;

  /** Overall MMI statistics */
  overall: PlayerMMISummary;

  /** MMI by split */
  splits?: {
    home?: PlayerMMISummary;
    away?: PlayerMMISummary;
    vs_left?: PlayerMMISummary;
    vs_right?: PlayerMMISummary;
    early_innings?: PlayerMMISummary; // Innings 1-6
    late_innings?: PlayerMMISummary;  // Innings 7-9
    extra_innings?: PlayerMMISummary; // Innings 10+
  };

  /** Monthly trends */
  monthly?: Array<{
    month: number; // 1-12
    month_name: string;
    summary: PlayerMMISummary;
  }>;

  /** Response metadata */
  meta: MMIMetadata;
}

/**
 * MMI API error response
 */
export interface MMIErrorResponse {
  /** Error message */
  error: string;
  /** Error timestamp */
  timestamp: string;
  /** HTTP status code */
  status?: number;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * MMI service health check response
 */
export interface MMIHealthResponse {
  /** Service status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Package version */
  version: string;
  /** Timestamp of health check */
  timestamp: string;
  /** Component health statuses */
  components?: {
    database?: 'up' | 'down';
    mlb_api?: 'up' | 'down';
    normalization?: 'loaded' | 'missing';
  };
}

/**
 * Type guard to check if response is an error
 */
export function isMMIError(
  response: unknown
): response is MMIErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as MMIErrorResponse).error === 'string'
  );
}

/**
 * Type guard to check if response is game MMI data
 */
export function isGameMMIResponse(
  response: unknown
): response is GameMMIResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'game_id' in response &&
    'pitches' in response &&
    Array.isArray((response as GameMMIResponse).pitches)
  );
}

/**
 * MMI component weights (default configuration)
 */
export const MMI_WEIGHTS = {
  LEVERAGE: 0.35,
  PRESSURE: 0.20,
  FATIGUE: 0.20,
  EXECUTION: 0.15,
  BIO_PROXIES: 0.10,
} as const;

/**
 * MMI thresholds for categorization
 */
export const MMI_THRESHOLDS = {
  /** Low mental demand */
  LOW: 1.0,
  /** Moderate mental demand */
  MODERATE: 2.0,
  /** High mental demand */
  HIGH: 3.0,
  /** Extreme mental demand */
  EXTREME: 4.0,
} as const;

/**
 * Get MMI category label
 */
export function getMMICategory(mmi: number): string {
  if (mmi >= MMI_THRESHOLDS.EXTREME) return 'Extreme';
  if (mmi >= MMI_THRESHOLDS.HIGH) return 'High';
  if (mmi >= MMI_THRESHOLDS.MODERATE) return 'Moderate';
  if (mmi >= MMI_THRESHOLDS.LOW) return 'Low';
  return 'Minimal';
}

/**
 * Get MMI category color (Tailwind classes)
 */
export function getMMICategoryColor(mmi: number): string {
  if (mmi >= MMI_THRESHOLDS.EXTREME) return 'text-red-600 bg-red-50';
  if (mmi >= MMI_THRESHOLDS.HIGH) return 'text-orange-600 bg-orange-50';
  if (mmi >= MMI_THRESHOLDS.MODERATE) return 'text-yellow-600 bg-yellow-50';
  if (mmi >= MMI_THRESHOLDS.LOW) return 'text-blue-600 bg-blue-50';
  return 'text-gray-600 bg-gray-50';
}

/**
 * Format count as string (e.g., "2-1")
 */
export function formatCount(balls: number, strikes: number): string {
  return `${balls}-${strikes}`;
}

/**
 * Get count description
 */
export function getCountDescription(balls: number, strikes: number): string {
  if (balls === 3 && strikes === 2) return 'Full count';
  if (balls === 3) return `${balls}-${strikes} (ball 4 possible)`;
  if (strikes === 2) return `${balls}-${strikes} (K possible)`;
  return formatCount(balls, strikes);
}

/**
 * Format inning display
 */
export function formatInning(inning: number, isTop: boolean): string {
  const half = isTop ? 'Top' : 'Bottom';
  if (inning > 9) return `${half} ${inning} (Extra Innings)`;
  return `${half} ${inning}`;
}
