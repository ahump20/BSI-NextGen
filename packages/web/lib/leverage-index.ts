/**
 * Leverage Index Calculator for NCAA Games
 *
 * Quantifies game importance based on:
 * - Team standings position
 * - Pythagorean expectation differential
 * - Opponent strength (ranking)
 * - Current momentum (streaks)
 *
 * Scale: 0-10 (low to high leverage)
 */

export interface LeverageIndexInputs {
  // Team record
  wins: number;
  losses: number;
  ties?: number;

  // Pythagorean data
  actualWins: number;
  expectedWins: number | null;

  // Opponent data
  opponentRank: number | null; // null if unranked
  opponentRecord?: string; // "12-3"

  // Momentum
  streakValue: number | null; // positive for wins, negative for losses

  // Game context
  isConferenceGame?: boolean;
  isRivalryGame?: boolean;
  isHomeGame?: boolean;
}

export interface LeverageIndexResult {
  index: number; // 0-10
  label: string; // "Critical", "High", "Moderate", "Low"
  color: string; // CSS color for display
  factors: {
    standingImpact: number; // 0-10
    pythagoreanPressure: number; // 0-10
    opponentStrength: number; // 0-10
    momentumFactor: number; // 0-10
  };
  description: string;
}

/**
 * Calculate Standing Impact (0-10)
 * Teams near .500 or fighting for playoff spots have higher pressure
 */
function calculateStandingImpact(wins: number, losses: number, ties: number = 0): number {
  const totalGames = wins + losses + ties;
  if (totalGames === 0) return 5; // Early season default

  const winPct = (wins + ties * 0.5) / totalGames;

  // Pressure is highest near .500 (fighting to stay above water)
  // and very high/low (protecting position or desperate)
  if (winPct >= 0.45 && winPct <= 0.55) {
    return 8; // Critical threshold
  } else if (winPct >= 0.70) {
    return 7; // Protecting elite status
  } else if (winPct <= 0.30) {
    return 6; // Desperate to turn season around
  } else if (winPct >= 0.56 && winPct <= 0.69) {
    return 6; // Solid but need to maintain
  } else {
    return 4; // Below .500 but not desperate yet
  }
}

/**
 * Calculate Pythagorean Pressure (0-10)
 * Teams outperforming expectation face regression pressure
 * Teams underperforming have "prove it" pressure
 */
function calculatePythagoreanPressure(actualWins: number, expectedWins: number | null): number {
  if (!expectedWins && expectedWins !== 0) return 5; // No data

  const differential = actualWins - expectedWins;

  // Overperforming by 2+ wins: regression pressure
  if (differential >= 2) {
    return 8;
  }
  // Underperforming by 2+ wins: redemption pressure
  else if (differential <= -2) {
    return 7;
  }
  // Slight overperformance
  else if (differential >= 1) {
    return 6;
  }
  // Slight underperformance
  else if (differential <= -1) {
    return 6;
  }
  // On track with expectations
  else {
    return 4;
  }
}

/**
 * Calculate Opponent Strength (0-10)
 * Ranked opponents = high leverage
 */
function calculateOpponentStrength(
  opponentRank: number | null,
  opponentRecord?: string
): number {
  if (opponentRank !== null) {
    // Top 5: Maximum leverage
    if (opponentRank <= 5) return 10;
    // Top 10
    if (opponentRank <= 10) return 9;
    // Top 25
    if (opponentRank <= 25) return 7;
    // Receiving votes (26-35)
    if (opponentRank <= 35) return 5;
  }

  // If no rank but have record, estimate
  if (opponentRecord) {
    const match = opponentRecord.match(/(\d+)-(\d+)/);
    if (match) {
      const oppWins = parseInt(match[1]);
      const oppLosses = parseInt(match[2]);
      const oppPct = oppWins / (oppWins + oppLosses);

      if (oppPct >= 0.75) return 6;
      if (oppPct >= 0.60) return 5;
      if (oppPct >= 0.50) return 4;
    }
  }

  return 3; // Unranked opponent, unknown record
}

/**
 * Calculate Momentum Factor (0-10)
 * Win/loss streaks create pressure
 */
function calculateMomentumFactor(streakValue: number | null): number {
  if (!streakValue) return 5; // Neutral

  const absStreak = Math.abs(streakValue);

  if (streakValue > 0) {
    // Win streak: pressure to maintain
    if (absStreak >= 5) return 8;
    if (absStreak >= 3) return 6;
    return 5;
  } else {
    // Loss streak: desperation to end it
    if (absStreak >= 4) return 9;
    if (absStreak >= 2) return 7;
    return 6;
  }
}

/**
 * Calculate overall Leverage Index
 */
export function calculateLeverageIndex(inputs: LeverageIndexInputs): LeverageIndexResult {
  const standingImpact = calculateStandingImpact(inputs.wins, inputs.losses, inputs.ties);
  const pythagoreanPressure = calculatePythagoreanPressure(inputs.actualWins, inputs.expectedWins);
  const opponentStrength = calculateOpponentStrength(inputs.opponentRank, inputs.opponentRecord);
  const momentumFactor = calculateMomentumFactor(inputs.streakValue);

  // Weighted average
  let index =
    (0.30 * standingImpact) +
    (0.25 * pythagoreanPressure) +
    (0.25 * opponentStrength) +
    (0.20 * momentumFactor);

  // Context multipliers
  if (inputs.isRivalryGame) {
    index = Math.min(10, index * 1.15); // 15% boost for rivalry
  }
  if (inputs.isConferenceGame) {
    index = Math.min(10, index * 1.10); // 10% boost for conference
  }

  // Round to 1 decimal
  index = Math.round(index * 10) / 10;

  // Determine label and color
  let label: string;
  let color: string;
  let description: string;

  if (index >= 8.0) {
    label = "Critical";
    color = "rgb(239, 68, 68)"; // Red
    description = "Season-defining moment. Every possession matters.";
  } else if (index >= 6.5) {
    label = "High";
    color = "rgb(251, 146, 60)"; // Orange
    description = "Significant impact on season trajectory.";
  } else if (index >= 5.0) {
    label = "Moderate";
    color = "rgb(251, 191, 36)"; // Amber
    description = "Important game with meaningful implications.";
  } else if (index >= 3.5) {
    label = "Low-Moderate";
    color = "rgb(59, 130, 246)"; // Blue
    description = "Standard game with some importance.";
  } else {
    label = "Low";
    color = "rgb(100, 116, 139)"; // Gray
    description = "Early season or low-stakes matchup.";
  }

  return {
    index,
    label,
    color,
    description,
    factors: {
      standingImpact,
      pythagoreanPressure,
      opponentStrength,
      momentumFactor
    }
  };
}

/**
 * Format leverage index for display
 */
export function formatLeverageIndex(result: LeverageIndexResult): string {
  return `${result.index}/10 (${result.label})`;
}
