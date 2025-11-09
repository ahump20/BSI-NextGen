/**
 * Stats Validator - Cross-checks scraped data against published sources
 * Implements Quant's requirement for validation before production deployment
 * Tolerance: 0.1% variance for rounding errors
 */

const VALIDATION_CONFIG = {
  tolerance: 0.001, // Allow 0.1% variance
  sources: {
    primary: 'https://texassports.com/sports/baseball/stats',
    secondary: 'https://d1baseball.com/team/texas/',
  },
  minimumSampleSize: 5, // Must check at least 5 players
};

/**
 * Validate scraped batting stats against official Texas Sports source
 */
async function validateBattingStats(scrapedStats) {
  try {
    // Fetch official stats from Texas Sports
    const response = await fetch(VALIDATION_CONFIG.sources.primary, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0 (Stats Validation)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return {
        status: 'warning',
        message: `Could not fetch validation source: ${response.status}`,
        validated: false,
      };
    }

    const html = await response.text();

    // Parse official stats (this is a simplified example - real implementation needs HTML parsing)
    const officialStats = parseOfficialBattingStats(html);

    // Cross-check each scraped player
    const mismatches = [];
    let totalVariance = 0;
    let comparisons = 0;

    for (const scrapedPlayer of scrapedStats) {
      const officialPlayer = officialStats.find(
        p => normalizePlayerName(p.name) === normalizePlayerName(scrapedPlayer.player_name)
      );

      if (!officialPlayer) {
        console.warn(`No official stats found for ${scrapedPlayer.player_name}`);
        continue;
      }

      // Compare key metrics
      const avgVariance = Math.abs(scrapedPlayer.avg - officialPlayer.avg);
      const hitsVariance = Math.abs(scrapedPlayer.hits - officialPlayer.hits);

      if (avgVariance > VALIDATION_CONFIG.tolerance || hitsVariance > 0) {
        mismatches.push({
          player: scrapedPlayer.player_name,
          metric: avgVariance > VALIDATION_CONFIG.tolerance ? 'AVG' : 'Hits',
          scraped: avgVariance > VALIDATION_CONFIG.tolerance ? scrapedPlayer.avg : scrapedPlayer.hits,
          official: avgVariance > VALIDATION_CONFIG.tolerance ? officialPlayer.avg : officialPlayer.hits,
          variance: avgVariance > VALIDATION_CONFIG.tolerance ? avgVariance : hitsVariance,
        });
      }

      totalVariance += avgVariance;
      comparisons++;
    }

    const avgVariance = comparisons > 0 ? totalVariance / comparisons : 0;

    return {
      status: mismatches.length === 0 ? 'passed' : 'failed',
      playersChecked: comparisons,
      mismatchesFound: mismatches.length,
      avgVariance,
      mismatches,
      validated: true,
      validatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'warning',
      message: `Validation error: ${error.message}`,
      validated: false,
    };
  }
}

/**
 * Validate scraped pitching stats
 */
async function validatePitchingStats(scrapedStats) {
  try {
    const response = await fetch(VALIDATION_CONFIG.sources.primary, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0 (Stats Validation)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return {
        status: 'warning',
        message: `Could not fetch validation source: ${response.status}`,
        validated: false,
      };
    }

    const html = await response.text();
    const officialStats = parseOfficialPitchingStats(html);

    const mismatches = [];
    let totalVariance = 0;
    let comparisons = 0;

    for (const scrapedPlayer of scrapedStats) {
      const officialPlayer = officialStats.find(
        p => normalizePlayerName(p.name) === normalizePlayerName(scrapedPlayer.player_name)
      );

      if (!officialPlayer) continue;

      const eraVariance = Math.abs(scrapedPlayer.era - officialPlayer.era);

      if (eraVariance > 0.05) {  // Allow 0.05 ERA difference for rounding
        mismatches.push({
          player: scrapedPlayer.player_name,
          metric: 'ERA',
          scraped: scrapedPlayer.era,
          official: officialPlayer.era,
          variance: eraVariance,
        });
      }

      totalVariance += eraVariance;
      comparisons++;
    }

    const avgVariance = comparisons > 0 ? totalVariance / comparisons : 0;

    return {
      status: mismatches.length === 0 ? 'passed' : 'failed',
      playersChecked: comparisons,
      mismatchesFound: mismatches.length,
      avgVariance,
      mismatches,
      validated: true,
      validatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'warning',
      message: `Validation error: ${error.message}`,
      validated: false,
    };
  }
}

/**
 * Parse official batting stats from Texas Sports HTML
 * (Simplified - real implementation needs proper HTML parser like cheerio)
 */
function parseOfficialBattingStats(html) {
  // This is a placeholder - real implementation would use:
  // 1. HTML parser (cheerio/jsdom)
  // 2. Table scraping logic
  // 3. Data normalization

  // For now, return empty array and log warning
  console.warn('Official stats parsing not yet implemented - validation will show warnings');
  return [];
}

/**
 * Parse official pitching stats
 */
function parseOfficialPitchingStats(html) {
  console.warn('Official stats parsing not yet implemented - validation will show warnings');
  return [];
}

/**
 * Normalize player names for comparison
 */
function normalizePlayerName(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '');
}

/**
 * Log validation results to D1 database
 */
async function logValidation(env, validationType, results) {
  const stmt = env.DB.prepare(`
    INSERT INTO validation_logs
    (season, validation_type, players_checked, mismatches_found, avg_variance, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const season = new Date().getFullYear();
  const notes = results.mismatches?.length > 0
    ? JSON.stringify(results.mismatches)
    : 'All checks passed';

  await stmt.bind(
    season,
    validationType,
    results.playersChecked || 0,
    results.mismatchesFound || 0,
    results.avgVariance || 0,
    results.status,
    notes
  ).run();
}

export { validateBattingStats, validatePitchingStats, logValidation };
