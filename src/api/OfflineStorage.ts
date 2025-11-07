/**
 * OfflineStorage.ts
 * Local storage management for offline mode support
 * Caches player progress, leaderboard data, and game results
 */

import { PlayerProgress } from "./progression";

export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

export interface PendingGameResult {
  playerId: string;
  won: boolean;
  runsScored: number;
  hitsRecorded: number;
  homeRunsHit: number;
  timestamp: number;
}

export class OfflineStorage {
  private static readonly STORAGE_PREFIX = "sandlot_sluggers_";
  private static readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

  /**
   * Storage keys
   */
  private static readonly KEYS = {
    PLAYER_PROGRESS: "player_progress",
    LEADERBOARD: "leaderboard",
    PENDING_RESULTS: "pending_results",
    LAST_SYNC: "last_sync"
  };

  /**
   * Check if localStorage is available
   */
  private static isStorageAvailable(): boolean {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get full storage key with prefix
   */
  private static getKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }

  /**
   * Set item in localStorage with optional expiration
   */
  private static setItem<T>(key: string, data: T, ttl?: number): void {
    if (!this.isStorageAvailable()) {
      console.warn("localStorage is not available");
      return;
    }

    try {
      const cached: CachedData<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(cached));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  /**
   * Get item from localStorage with expiration check
   */
  private static getItem<T>(key: string): T | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const cached = JSON.parse(item) as CachedData<T>;

      // Check expiration
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        this.removeItem(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error("Failed to read from localStorage:", error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  private static removeItem(key: string): void {
    if (!this.isStorageAvailable()) return;

    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error("Failed to remove from localStorage:", error);
    }
  }

  /**
   * Clear all cached data
   */
  public static clearAll(): void {
    if (!this.isStorageAvailable()) return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }

  /**
   * Cache player progress
   */
  public static cachePlayerProgress(
    playerId: string,
    progress: PlayerProgress
  ): void {
    const key = `${this.KEYS.PLAYER_PROGRESS}_${playerId}`;
    this.setItem(key, progress, this.CACHE_DURATION);
  }

  /**
   * Get cached player progress
   */
  public static getCachedPlayerProgress(playerId: string): PlayerProgress | null {
    const key = `${this.KEYS.PLAYER_PROGRESS}_${playerId}`;
    return this.getItem<PlayerProgress>(key);
  }

  /**
   * Cache leaderboard data
   */
  public static cacheLeaderboard(data: PlayerProgress[]): void {
    this.setItem(this.KEYS.LEADERBOARD, data, this.CACHE_DURATION);
  }

  /**
   * Get cached leaderboard
   */
  public static getCachedLeaderboard(): PlayerProgress[] | null {
    return this.getItem<PlayerProgress[]>(this.KEYS.LEADERBOARD);
  }

  /**
   * Add pending game result (to be synced later)
   */
  public static addPendingGameResult(result: PendingGameResult): void {
    const pending = this.getPendingGameResults();
    pending.push(result);
    this.setItem(this.KEYS.PENDING_RESULTS, pending);
  }

  /**
   * Get all pending game results
   */
  public static getPendingGameResults(): PendingGameResult[] {
    return this.getItem<PendingGameResult[]>(this.KEYS.PENDING_RESULTS) || [];
  }

  /**
   * Clear pending game results after successful sync
   */
  public static clearPendingGameResults(): void {
    this.removeItem(this.KEYS.PENDING_RESULTS);
  }

  /**
   * Remove a specific pending result
   */
  public static removePendingResult(timestamp: number): void {
    const pending = this.getPendingGameResults();
    const filtered = pending.filter(r => r.timestamp !== timestamp);
    this.setItem(this.KEYS.PENDING_RESULTS, filtered);
  }

  /**
   * Update last sync timestamp
   */
  public static updateLastSync(): void {
    this.setItem(this.KEYS.LAST_SYNC, Date.now());
  }

  /**
   * Get last sync timestamp
   */
  public static getLastSync(): number | null {
    return this.getItem<number>(this.KEYS.LAST_SYNC);
  }

  /**
   * Check if data is stale (older than TTL)
   */
  public static isDataStale(key: string): boolean {
    if (!this.isStorageAvailable()) return true;

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return true;

      const cached = JSON.parse(item) as CachedData<any>;

      // Check if expired
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        return true;
      }

      // Check if older than cache duration
      return Date.now() - cached.timestamp > this.CACHE_DURATION;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get storage usage statistics
   */
  public static getStorageStats(): {
    used: number;
    available: number;
    percentage: number;
  } | null {
    if (!this.isStorageAvailable()) return null;

    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);

      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length + key.length;
          }
        }
      });

      // Estimate localStorage limit (usually 5-10MB)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB

      return {
        used: totalSize,
        available: estimatedLimit - totalSize,
        percentage: (totalSize / estimatedLimit) * 100
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Export all cached data (for debugging)
   */
  public static exportData(): Record<string, any> {
    if (!this.isStorageAvailable()) return {};

    try {
      const data: Record<string, any> = {};
      const keys = Object.keys(localStorage);

      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          }
        }
      });

      return data;
    } catch (error) {
      console.error("Failed to export data:", error);
      return {};
    }
  }

  /**
   * Import cached data (for debugging/testing)
   */
  public static importData(data: Record<string, any>): void {
    if (!this.isStorageAvailable()) return;

    try {
      Object.entries(data).forEach(([key, value]) => {
        const storageValue = typeof value === "string"
          ? value
          : JSON.stringify(value);
        localStorage.setItem(key, storageValue);
      });
    } catch (error) {
      console.error("Failed to import data:", error);
    }
  }
}
