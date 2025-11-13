/**
 * Season-Aware Defaults Calculator for NCAA Sports
 *
 * Automatically determines appropriate year/week parameters based on current date
 * Updated for 2025-26 season schedules
 */

export interface SeasonDefaults {
  year: string;
  week: string;
  inSeason: boolean;
  seasonLabel: string;
}

/**
 * Calculate basketball season defaults
 * Season runs November - March/April
 */
function getBasketballDefaults(now: Date): SeasonDefaults {
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Basketball season: November (start) through April (tournament)
  // Season year corresponds to the spring year (e.g., 2025-26 season = 2026)

  if (month >= 10 || month <= 3) {
    // In season (November-April)
    const seasonYear = month >= 10 ? year + 1 : year;

    // Calculate day of season
    let seasonStartDate: Date;
    if (month >= 10) {
      // Current year November start
      seasonStartDate = new Date(year, 10, 1); // Nov 1 of current year
    } else {
      // Started in previous year November
      seasonStartDate = new Date(year - 1, 10, 1);
    }

    const daysSinceStart = Math.floor((now.getTime() - seasonStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.max(1, Math.min(Math.floor(daysSinceStart / 7) + 1, 180)); // Cap at 180 days

    return {
      year: seasonYear.toString(),
      week: week.toString(),
      inSeason: true,
      seasonLabel: `${seasonYear - 1}-${seasonYear.toString().slice(2)}`
    };
  } else {
    // Off-season (May-October)
    // Default to end of previous season
    return {
      year: year.toString(),
      week: '150', // Near end of previous season
      inSeason: false,
      seasonLabel: `${year - 1}-${year.toString().slice(2)} (ended)`
    };
  }
}

/**
 * Calculate football season defaults
 * Season runs August/September - January (bowls/playoff)
 */
function getFootballDefaults(now: Date): SeasonDefaults {
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Football season: September-January
  // Season year corresponds to the fall year (e.g., 2024 season starts fall 2024)

  if ((month >= 8 && month <= 11) || month === 0) {
    // In season (September-January)
    const seasonYear = month === 0 ? year - 1 : year;

    // Calculate week of season
    let seasonStartDate: Date;
    if (month >= 8) {
      // Current year start (late August/early September)
      seasonStartDate = new Date(year, 7, 25); // Aug 25 approximate start
    } else {
      // Started previous year
      seasonStartDate = new Date(year - 1, 7, 25);
    }

    const daysSinceStart = Math.floor((now.getTime() - seasonStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.max(1, Math.min(Math.floor(daysSinceStart / 7) + 1, 20)); // Cap at week 20 (bowls/playoff)

    return {
      year: seasonYear.toString(),
      week: week.toString(),
      inSeason: true,
      seasonLabel: `${seasonYear}`
    };
  } else {
    // Off-season (February-August)
    // Default to end of previous season
    const lastSeasonYear = month >= 2 ? year - 1 : year - 1;
    return {
      year: lastSeasonYear.toString(),
      week: '15', // Regular season finale
      inSeason: false,
      seasonLabel: `${lastSeasonYear} (ended)`
    };
  }
}

/**
 * Calculate baseball season defaults
 * Season runs February - June
 */
function getBaseballDefaults(now: Date): SeasonDefaults {
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Baseball season: February-June
  // Season year corresponds to the calendar year (e.g., 2025 season = 2025)

  if (month >= 1 && month <= 5) {
    // In season (February-June)
    const seasonYear = year;

    // Calculate day of season
    const seasonStartDate = new Date(year, 1, 14); // Feb 14 opening day
    const daysSinceStart = Math.floor((now.getTime() - seasonStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.max(1, Math.min(Math.floor(daysSinceStart / 7) + 1, 20)); // Cap at 20 weeks

    return {
      year: seasonYear.toString(),
      week: week.toString(),
      inSeason: true,
      seasonLabel: `${seasonYear}`
    };
  } else if (month >= 6) {
    // After season ended (July-December)
    // Default to end of current year season
    return {
      year: year.toString(),
      week: '18', // Late in season
      inSeason: false,
      seasonLabel: `${year} (ended)`
    };
  } else {
    // Before season starts (January)
    // Default to end of previous season
    return {
      year: (year - 1).toString(),
      week: '18',
      inSeason: false,
      seasonLabel: `${year - 1} (ended)`
    };
  }
}

/**
 * Get season defaults for a specific sport
 */
export function getSeasonDefaults(sport: string, now: Date = new Date()): SeasonDefaults {
  const normalizedSport = sport.toLowerCase();

  switch (normalizedSport) {
    case 'basketball':
      return getBasketballDefaults(now);
    case 'football':
      return getFootballDefaults(now);
    case 'baseball':
      return getBaseballDefaults(now);
    default:
      // Fallback to basketball logic for unknown sports
      return getBasketballDefaults(now);
  }
}

/**
 * Format season label for display
 */
export function formatSeasonLabel(sport: string, year: string, inSeason: boolean): string {
  const normalizedSport = sport.toLowerCase();

  if (normalizedSport === 'basketball') {
    const seasonYear = parseInt(year);
    const label = `${seasonYear - 1}-${seasonYear.toString().slice(2)}`;
    return inSeason ? `${label} Season (Active)` : `${label} Season (Ended)`;
  } else {
    return inSeason ? `${year} Season (Active)` : `${year} Season (Ended)`;
  }
}

/**
 * Get descriptive season status message
 */
export function getSeasonStatus(sport: string, now: Date = new Date()): string {
  const defaults = getSeasonDefaults(sport, now);

  if (defaults.inSeason) {
    return `Currently in ${defaults.seasonLabel} season (Week ${defaults.week})`;
  } else {
    return `Off-season. Showing ${defaults.seasonLabel} data`;
  }
}
