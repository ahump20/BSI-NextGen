/**
 * Texas Longhorns Baseball Stats Scraper - Game-by-Game Edition
 * Fetches individual game box scores instead of season aggregates
 * Includes retry logic, exponential backoff, and User-Agent compliance
 *
 * CRITICAL FIX: Now fetches game-by-game data with full context:
 * - Opponent
 * - Game date
 * - Home/away status
 * - Game result (win/loss/in-progress)
 */

const TEXAS_TEAM_ID = '251'; // Texas Longhorns ESPN team ID
const CURRENT_SEASON = new Date().getFullYear();

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
 * Parse game date and determine home/away status
 */
function parseGameContext(game) {
  const competition = game.competitions?.[0];
  if (!competition) return null;

  const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
  const texasIsHome = homeTeam?.team?.id === TEXAS_TEAM_ID;
  const opponent = texasIsHome ? awayTeam : homeTeam;

  return {
    gameId: game.id,
    gameDate: new Date(game.date).toISOString().split('T')[0], // YYYY-MM-DD
    opponent: opponent?.team?.displayName || 'Unknown',
    opponentId: opponent?.team?.id || null,
    homeAway: texasIsHome ? 'home' : 'away',
    status: game.status?.type?.completed ? 'final' : 'in_progress',
    texasScore: texasIsHome ? homeTeam?.score : awayTeam?.score,
    opponentScore: texasIsHome ? awayTeam?.score : homeTeam?.score,
    result: null, // Will be computed after we know scores
  };
}

/**
 * Fetch current season game schedule
 */
async function fetchGameSchedule() {
  return retryWithBackoff(async () => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${TEXAS_TEAM_ID}/schedule?season=${CURRENT_SEASON}`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`ESPN Schedule API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const events = data.events || [];

    // Filter for completed games only
    const completedGames = events.filter(game => {
      const status = game.status?.type?.completed;
      return status === true;
    });

    console.log(`Found ${completedGames.length} completed games out of ${events.length} total`);

    return completedGames.map(game => {
      const context = parseGameContext(game);
      if (!context) return null;

      // Determine game result
      if (context.texasScore > context.opponentScore) {
        context.result = 'W';
      } else if (context.texasScore < context.opponentScore) {
        context.result = 'L';
      } else {
        context.result = 'T'; // Rare in baseball, but possible
      }

      return context;
    }).filter(Boolean);
  });
}

/**
 * Fetch box score for a specific game
 */
async function fetchGameBoxScore(gameId) {
  return retryWithBackoff(async () => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/summary?event=${gameId}`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`ESPN Box Score API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.boxscore || null;
  });
}

/**
 * Extract batting stats from box score
 */
function extractBattingStats(boxscore, gameContext) {
  const battingStats = [];

  if (!boxscore || !boxscore.players) {
    console.warn(`No box score data for game ${gameContext.gameId}`);
    return battingStats;
  }

  // Find Texas team in box score
  const texasTeam = boxscore.players.find(team => team.team?.id === TEXAS_TEAM_ID);
  if (!texasTeam) {
    console.warn(`Texas not found in box score for game ${gameContext.gameId}`);
    return battingStats;
  }

  // Get batting statistics
  const battingSection = texasTeam.statistics?.find(section =>
    section.name === 'batting' || section.type === 'batting'
  );

  if (!battingSection || !battingSection.athletes) {
    console.warn(`No batting stats for Texas in game ${gameContext.gameId}`);
    return battingStats;
  }

  for (const athlete of battingSection.athletes) {
    const stats = athlete.stats || [];

    // ESPN box scores return stats as array of strings
    // Typical order: AB, R, H, RBI, BB, SO, 2B, 3B, HR, SB, CS
    const [ab, r, h, rbi, bb, so, doubles, triples, hr, sb, cs] = stats.map(s => parseInt(s) || 0);

    // Only include players with at-bats
    if (ab === 0) continue;

    battingStats.push({
      player_name: normalizePlayerName(athlete.athlete?.displayName || 'Unknown'),
      stat_type: 'batting',
      team_id: TEXAS_TEAM_ID,
      season: CURRENT_SEASON,
      game_date: gameContext.gameDate,
      opponent: gameContext.opponent,
      opponent_id: gameContext.opponentId,
      home_away: gameContext.homeAway,
      game_result: gameContext.result,
      at_bats: ab,
      runs: r,
      hits: h,
      doubles: doubles,
      triples: triples,
      home_runs: hr,
      rbi: rbi,
      walks: bb,
      strikeouts: so,
      stolen_bases: sb,
      caught_stealing: cs,
    });
  }

  return battingStats;
}

/**
 * Extract pitching stats from box score
 */
function extractPitchingStats(boxscore, gameContext) {
  const pitchingStats = [];

  if (!boxscore || !boxscore.players) {
    console.warn(`No box score data for game ${gameContext.gameId}`);
    return pitchingStats;
  }

  // Find Texas team in box score
  const texasTeam = boxscore.players.find(team => team.team?.id === TEXAS_TEAM_ID);
  if (!texasTeam) {
    console.warn(`Texas not found in box score for game ${gameContext.gameId}`);
    return pitchingStats;
  }

  // Get pitching statistics
  const pitchingSection = texasTeam.statistics?.find(section =>
    section.name === 'pitching' || section.type === 'pitching'
  );

  if (!pitchingSection || !pitchingSection.athletes) {
    console.warn(`No pitching stats for Texas in game ${gameContext.gameId}`);
    return pitchingStats;
  }

  for (const athlete of pitchingSection.athletes) {
    const stats = athlete.stats || [];

    // ESPN box scores return stats as array of strings
    // Typical order: IP, H, R, ER, BB, SO, HR, PC-ST (pitch count), ERA
    const [ip, h, r, er, bb, so, hr] = stats.map((s, idx) => {
      // IP is a float, others are integers
      if (idx === 0) return parseFloat(s) || 0;
      return parseInt(s) || 0;
    });

    // Only include pitchers with innings pitched
    if (ip === 0) continue;

    pitchingStats.push({
      player_name: normalizePlayerName(athlete.athlete?.displayName || 'Unknown'),
      stat_type: 'pitching',
      team_id: TEXAS_TEAM_ID,
      season: CURRENT_SEASON,
      game_date: gameContext.gameDate,
      opponent: gameContext.opponent,
      opponent_id: gameContext.opponentId,
      home_away: gameContext.homeAway,
      game_result: gameContext.result,
      innings_pitched: ip,
      hits_allowed: h,
      runs_allowed: r,
      earned_runs: er,
      walks_allowed: bb,
      strikeouts_pitched: so,
      home_runs_allowed: hr,
    });
  }

  return pitchingStats;
}

/**
 * Compute advanced sabermetrics (same as before)
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
 * Main scrape function - gets all Texas Longhorns game-by-game stats
 */
async function scrapeAllStats() {
  const startTime = Date.now();

  try {
    // Step 1: Fetch game schedule
    console.log('Fetching game schedule...');
    const games = await fetchGameSchedule();
    console.log(`Found ${games.length} completed games`);

    if (games.length === 0) {
      return {
        success: true,
        data: [],
        metadata: {
          team: 'Texas Longhorns',
          season: CURRENT_SEASON,
          source: 'ESPN Box Score API',
          scrapedAt: new Date().toISOString(),
          duration: `${Date.now() - startTime}ms`,
          gamesProcessed: 0,
          playerStats: 0,
        },
      };
    }

    // Step 2: Fetch box scores for all games (with rate limiting)
    const allStats = [];
    let gamesProcessed = 0;

    for (const gameContext of games) {
      try {
        console.log(`Fetching box score for ${gameContext.gameDate} vs ${gameContext.opponent}...`);

        const boxscore = await fetchGameBoxScore(gameContext.gameId);

        if (!boxscore) {
          console.warn(`No box score available for game ${gameContext.gameId}`);
          continue;
        }

        // Extract batting and pitching stats
        const battingStats = extractBattingStats(boxscore, gameContext);
        const pitchingStats = extractPitchingStats(boxscore, gameContext);

        // Compute advanced stats
        const gameStats = [
          ...battingStats.map(computeAdvancedStats),
          ...pitchingStats.map(computeAdvancedStats),
        ];

        allStats.push(...gameStats);
        gamesProcessed++;

        console.log(`✓ Game ${gamesProcessed}/${games.length}: ${battingStats.length} batting, ${pitchingStats.length} pitching`);

        // Rate limiting: 100ms delay between box score requests
        await sleep(100);

      } catch (error) {
        console.error(`Failed to process game ${gameContext.gameDate} vs ${gameContext.opponent}:`, error.message);
        // Continue with next game
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: allStats,
      metadata: {
        team: 'Texas Longhorns',
        season: CURRENT_SEASON,
        source: 'ESPN Box Score API',
        scrapedAt: new Date().toISOString(),
        duration: `${duration}ms`,
        gamesProcessed,
        gamesTotal: games.length,
        playerStats: allStats.length,
        battingStats: allStats.filter(s => s.stat_type === 'batting').length,
        pitchingStats: allStats.filter(s => s.stat_type === 'pitching').length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metadata: {
        team: 'Texas Longhorns',
        season: CURRENT_SEASON,
        scrapedAt: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`,
      },
    };
  }
}

// Export for Cloudflare Worker
export {
  scrapeAllStats,
  fetchGameSchedule,
  fetchGameBoxScore,
  extractBattingStats,
  extractPitchingStats,
  computeAdvancedStats
};
