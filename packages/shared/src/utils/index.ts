/**
 * Blaze Sports Intel - Shared Utilities
 */

/**
 * Format date to America/Chicago timezone
 */
export function formatChicagoTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get current timestamp in America/Chicago timezone
 */
export function getChicagoTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Calculate win percentage
 */
export function calculateWinPercentage(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return parseFloat((wins / total).toFixed(3));
}

/**
 * Calculate games back
 */
export function calculateGamesBack(
  teamWins: number,
  teamLosses: number,
  leaderWins: number,
  leaderLosses: number
): number {
  return ((leaderWins - teamWins) + (teamLosses - leaderLosses)) / 2;
}

/**
 * Validate API key exists
 * During build time, returns a placeholder if key is missing
 */
export function validateApiKey(key: string | undefined, provider: string): string {
  if (!key) {
    // During Next.js build, allow missing keys with placeholder
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'development') {
      console.warn(`Warning: Missing API key for ${provider}. Using placeholder for build.`);
      return 'placeholder-api-key-for-build';
    }
    throw new Error(`Missing API key for ${provider}. Check environment variables.`);
  }
  return key;
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}
