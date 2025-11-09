/**
 * Texas Longhorns Baseball Stats Scraper
 * Scrapes texassports.com for real-time player statistics
 * Includes retry logic, exponential backoff, and User-Agent compliance
 */

const TEXAS_TEAM_ID = '251'; // Texas Longhorns ESPN team ID
const SCRAPE_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  timeout: 10000, // 10 seconds
  userAgent: 'BlazeSportsIntel/1.0 (College Baseball Analytics)',
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry wrapper
 */
async function retryWithBackoff(fn, retries = SCRAPE_CONFIG.maxRetries) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        const delay = SCRAPE_CONFIG.baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${retries} after ${delay}ms delay: ${error.message}`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Failed after ${retries} retries: ${lastError.message}`);
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCRAPE_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': SCRAPE_CONFIG.userAgent,
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Normalize player names (consistent format across sources)
 */
function normalizePlayerName(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Scrape current season batting statistics
 */
async function scrapeBattingStats() {
  return retryWithBackoff(async () => {
    // ESPN Stats API for Texas Longhorns baseball roster
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${TEXAS_TEAM_ID}/roster`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Get current season games for context
    const gamesUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${TEXAS_TEAM_ID}/schedule`;
    const gamesResponse = await fetchWithTimeout(gamesUrl);
    const gamesData = await gamesResponse.json();

    // Extract player statistics
    const battingStats = [];
    const athletes = data.athletes || [];

    for (const athlete of athletes) {
      if (!athlete.position || athlete.position.abbreviation === 'P') {
        continue; // Skip pitchers in batting stats
      }

      // Get detailed stats from athlete profile
      const statsUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/athletes/${athlete.id}/statistics`;

      try {
        const statsResponse = await fetchWithTimeout(statsUrl);
        const statsData = await statsResponse.json();

        const currentSeasonStats = statsData.statistics?.find(
          s => s.season === new Date().getFullYear() && s.type === 'batting'
        );

        if (currentSeasonStats && currentSeasonStats.stats) {
          const stats = currentSeasonStats.stats;

          // Only include players with at-bats
          const atBats = parseInt(stats.AB || 0);
          if (atBats === 0) continue;

          battingStats.push({
            player_name: normalizePlayerName(athlete.displayName),
            stat_type: 'batting',
            at_bats: atBats,
            runs: parseInt(stats.R || 0),
            hits: parseInt(stats.H || 0),
            doubles: parseInt(stats['2B'] || 0),
            triples: parseInt(stats['3B'] || 0),
            home_runs: parseInt(stats.HR || 0),
            rbi: parseInt(stats.RBI || 0),
            walks: parseInt(stats.BB || 0),
            strikeouts: parseInt(stats.SO || 0),
            stolen_bases: parseInt(stats.SB || 0),
            caught_stealing: parseInt(stats.CS || 0),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch stats for ${athlete.displayName}:`, error.message);
      }
    }

    return battingStats;
  });
}

/**
 * Scrape current season pitching statistics
 */
async function scrapePitchingStats() {
  return retryWithBackoff(async () => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${TEXAS_TEAM_ID}/roster`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const pitchingStats = [];
    const athletes = data.athletes || [];

    for (const athlete of athletes) {
      // Get detailed stats from athlete profile
      const statsUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/athletes/${athlete.id}/statistics`;

      try {
        const statsResponse = await fetchWithTimeout(statsUrl);
        const statsData = await statsResponse.json();

        const currentSeasonStats = statsData.statistics?.find(
          s => s.season === new Date().getFullYear() && s.type === 'pitching'
        );

        if (currentSeasonStats && currentSeasonStats.stats) {
          const stats = currentSeasonStats.stats;

          // Only include pitchers with innings pitched
          const inningsPitched = parseFloat(stats.IP || 0);
          if (inningsPitched === 0) continue;

          pitchingStats.push({
            player_name: normalizePlayerName(athlete.displayName),
            stat_type: 'pitching',
            innings_pitched: inningsPitched,
            hits_allowed: parseInt(stats.H || 0),
            runs_allowed: parseInt(stats.R || 0),
            earned_runs: parseInt(stats.ER || 0),
            walks_allowed: parseInt(stats.BB || 0),
            strikeouts_pitched: parseInt(stats.SO || 0),
            home_runs_allowed: parseInt(stats.HR || 0),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch pitching stats for ${athlete.displayName}:`, error.message);
      }
    }

    return pitchingStats;
  });
}

/**
 * Compute advanced sabermetrics
 */
function computeAdvancedStats(stats) {
  if (stats.stat_type === 'batting') {
    const ab = stats.at_bats || 0;
    const h = stats.hits || 0;
    const bb = stats.walks || 0;
    const doubles = stats.doubles || 0;
    const triples = stats.triples || 0;
    const hr = stats.home_runs || 0;
    const hbp = 0; // Hit by pitch not always available

    if (ab > 0) {
      const singles = h - doubles - triples - hr;
      const tb = singles + (2 * doubles) + (3 * triples) + (4 * hr);

      // ISO: Isolated Power
      stats.iso = parseFloat(((tb - h) / ab).toFixed(3));

      // wOBA: Weighted On-Base Average (simplified)
      const woba = ((0.69 * bb) + (0.89 * singles) + (1.27 * doubles) + (1.62 * triples) + (2.10 * hr)) / (ab + bb);
      stats.woba = parseFloat(woba.toFixed(3));
    }
  } else if (stats.stat_type === 'pitching') {
    const ip = stats.innings_pitched || 0;
    const er = stats.earned_runs || 0;
    const hr = stats.home_runs_allowed || 0;
    const bb = stats.walks_allowed || 0;
    const so = stats.strikeouts_pitched || 0;

    if (ip > 0) {
      // FIP: Fielding Independent Pitching
      const fip = ((13 * hr) + (3 * bb) - (2 * so)) / ip + 3.10;
      stats.fip = parseFloat(fip.toFixed(2));

      // K/BB ratio
      stats.k_bb_ratio = bb > 0 ? parseFloat((so / bb).toFixed(2)) : so;
    }
  }

  return stats;
}

/**
 * Main scrape function - gets all Texas Longhorns stats
 */
async function scrapeAllStats() {
  const startTime = Date.now();

  try {
    const [battingStats, pitchingStats] = await Promise.all([
      scrapeBattingStats(),
      scrapePitchingStats(),
    ]);

    // Compute advanced stats for all players
    const allStats = [
      ...battingStats.map(computeAdvancedStats),
      ...pitchingStats.map(computeAdvancedStats),
    ];

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: allStats,
      metadata: {
        team: 'Texas Longhorns',
        source: 'ESPN Stats API',
        scrapedAt: new Date().toISOString(),
        duration: `${duration}ms`,
        playerCount: allStats.length,
        battingCount: battingStats.length,
        pitchingCount: pitchingStats.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metadata: {
        team: 'Texas Longhorns',
        scrapedAt: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`,
      },
    };
  }
}

// Export for Cloudflare Worker
export { scrapeAllStats, scrapeBattingStats, scrapePitchingStats, computeAdvancedStats };
