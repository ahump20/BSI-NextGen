import { OfflineStorage, PendingGameResult } from "./OfflineStorage";
import {
  retryFetch,
  requestCache,
  withTimeout,
  CircuitBreaker,
  RetryConfig
} from "./RetryUtils";
import { getBlazeAPI, BlazePlayerStats, BlazeAPIError } from "../services/BlazeAPI";

export interface PlayerProgress {
  playerId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalRuns: number;
  totalHits: number;
  totalHomeRuns: number;
  unlockedCharacters: string[];
  unlockedStadiums: string[];
  currentLevel: number;
  experience: number;
}

export class ProgressionAPI {
  private baseUrl: string;
  private isOnline: boolean = navigator.onLine;
  private circuitBreaker: CircuitBreaker;
  private retryConfig: RetryConfig;
  private blazeAPI = getBlazeAPI();
  private useBlazeBackend: boolean;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
    this.useBlazeBackend = this.blazeAPI.isConfigured();

    // Initialize circuit breaker (5 failures, 1 minute cooldown)
    this.circuitBreaker = new CircuitBreaker(5, 60000, 2);

    // Configure retry behavior
    this.retryConfig = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      onRetry: (error, attempt, delay) => {
        console.warn(
          `API request failed (attempt ${attempt}), retrying in ${delay}ms...`,
          error
        );
      }
    };

    // Monitor online/offline status
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.circuitBreaker.reset();
      this.syncPendingResults();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  async getProgress(playerId: string): Promise<PlayerProgress> {
    const cacheKey = `getProgress:${playerId}`;

    return requestCache.getOrCreate(cacheKey, async () => {
      try {
        const progress = await this.circuitBreaker.execute(async () => {
          const response = await withTimeout(
            retryFetch(
              `${this.baseUrl}/progress/${playerId}`,
              undefined,
              this.retryConfig
            ),
            10000, // 10 second timeout
            "Request timed out while fetching player progress"
          );

          return response.json() as Promise<PlayerProgress>;
        });

        // Cache successful response
        OfflineStorage.cachePlayerProgress(playerId, progress);

        return progress;
      } catch (error) {
        console.warn("API request failed, attempting to use cached data:", error);

        // Try to use cached data
        const cachedProgress = OfflineStorage.getCachedPlayerProgress(playerId);

        if (cachedProgress) {
          console.info("Using cached player progress (offline mode)");
          return cachedProgress;
        }

        // No cached data available, throw original error
        throw error;
      }
    });
  }

  async updateProgress(
    playerId: string,
    updates: Partial<PlayerProgress>
  ): Promise<PlayerProgress> {
    const response = await fetch(`${this.baseUrl}/progress/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error("Failed to update progress");
    return response.json();
  }

  async recordGameResult(
    playerId: string,
    result: {
      won: boolean;
      runsScored: number;
      hitsRecorded: number;
      homeRunsHit: number;
      strikeouts?: number;
      atBats?: number;
    }
  ): Promise<PlayerProgress> {
    try {
      // Submit to Blaze Sports Intel if configured
      if (this.useBlazeBackend) {
        try {
          const blazeStats: BlazePlayerStats = {
            userId: playerId,
            gameId: `game-${Date.now()}`,
            timestamp: new Date().toISOString(),
            stats: {
              battingAverage: result.atBats ? result.hitsRecorded / result.atBats : 0,
              homeRuns: result.homeRunsHit,
              strikeouts: result.strikeouts || 0,
              hits: result.hitsRecorded,
              atBats: result.atBats || 0,
              rbi: result.runsScored,
              runs: result.runsScored,
            },
            gameResult: result.won ? "win" : "loss",
            difficulty: "medium", // TODO: Get from game settings
          };

          await this.blazeAPI.submitGameStats(blazeStats);
          console.log("✅ Stats synced to Blaze Sports Intel");
        } catch (blazeError) {
          console.warn("Failed to sync with Blaze Sports Intel:", blazeError);
          // Don't fail the entire operation if Blaze sync fails
        }
      }

      const progress = await this.circuitBreaker.execute(async () => {
        const response = await withTimeout(
          retryFetch(
            `${this.baseUrl}/game-result`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playerId, ...result })
            },
            this.retryConfig
          ),
          15000, // 15 second timeout for POST
          "Request timed out while recording game result"
        );

        return response.json() as Promise<PlayerProgress>;
      });

      // Cache updated progress
      OfflineStorage.cachePlayerProgress(playerId, progress);

      return progress;
    } catch (error) {
      console.warn("Failed to record game result online, queueing for later:", error);

      // Queue result for later sync
      const pendingResult: PendingGameResult = {
        playerId,
        ...result,
        timestamp: Date.now()
      };

      OfflineStorage.addPendingGameResult(pendingResult);

      // Try to get current cached progress and update it locally
      let cachedProgress = OfflineStorage.getCachedPlayerProgress(playerId);

      if (cachedProgress) {
        // Update local cache with result
        cachedProgress = {
          ...cachedProgress,
          gamesPlayed: cachedProgress.gamesPlayed + 1,
          wins: result.won ? cachedProgress.wins + 1 : cachedProgress.wins,
          losses: !result.won ? cachedProgress.losses + 1 : cachedProgress.losses,
          totalRuns: cachedProgress.totalRuns + result.runsScored,
          totalHits: cachedProgress.totalHits + result.hitsRecorded,
          totalHomeRuns: cachedProgress.totalHomeRuns + result.homeRunsHit
        };

        OfflineStorage.cachePlayerProgress(playerId, cachedProgress);

        console.info("Game result queued and local progress updated (offline mode)");

        return cachedProgress;
      }

      // No cached progress, throw original error
      throw error;
    }
  }

  /**
   * Sync pending game results when connection is restored
   */
  private async syncPendingResults(): Promise<void> {
    const pending = OfflineStorage.getPendingGameResults();

    if (pending.length === 0) {
      return;
    }

    console.info(`Syncing ${pending.length} pending game results...`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const result of pending) {
      try {
        await this.recordGameResult(result.playerId, {
          won: result.won,
          runsScored: result.runsScored,
          hitsRecorded: result.hitsRecorded,
          homeRunsHit: result.homeRunsHit
        });

        // Remove successfully synced result
        OfflineStorage.removePendingResult(result.timestamp);
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync game result:", error);
        failedCount++;
      }
    }

    if (syncedCount > 0) {
      OfflineStorage.updateLastSync();
      console.info(`Successfully synced ${syncedCount} game results`);
    }

    if (failedCount > 0) {
      console.warn(`Failed to sync ${failedCount} game results, will retry later`);
    }
  }

  /**
   * Manually trigger sync of pending results
   */
  public async syncNow(): Promise<{ synced: number; failed: number }> {
    const pending = OfflineStorage.getPendingGameResults();
    const initialCount = pending.length;

    await this.syncPendingResults();

    const remaining = OfflineStorage.getPendingGameResults().length;

    return {
      synced: initialCount - remaining,
      failed: remaining
    };
  }

  /**
   * Get count of pending results waiting to sync
   */
  public getPendingCount(): number {
    return OfflineStorage.getPendingGameResults().length;
  }

  /**
   * Check if currently offline
   */
  public isOffline(): boolean {
    return !this.isOnline;
  }

  async getLeaderboard(limit: number = 100): Promise<PlayerProgress[]> {
    const cacheKey = `getLeaderboard:${limit}`;

    return requestCache.getOrCreate(cacheKey, async () => {
      try {
        const leaderboard = await this.circuitBreaker.execute(async () => {
          const response = await withTimeout(
            retryFetch(
              `${this.baseUrl}/leaderboard?limit=${limit}`,
              undefined,
              this.retryConfig
            ),
            10000, // 10 second timeout
            "Request timed out while fetching leaderboard"
          );

          return response.json() as Promise<PlayerProgress[]>;
        });

        // Cache successful response
        OfflineStorage.cacheLeaderboard(leaderboard);

        return leaderboard;
      } catch (error) {
        console.warn("API request failed, attempting to use cached data:", error);

        // Try to use cached data
        const cachedLeaderboard = OfflineStorage.getCachedLeaderboard();

        if (cachedLeaderboard) {
          console.info("Using cached leaderboard (offline mode)");
          return cachedLeaderboard;
        }

        // No cached data available, throw original error
        throw error;
      }
    });
  }
}
