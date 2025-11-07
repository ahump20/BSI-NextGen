/**
 * Blaze Sports Intel API Client
 * Handles authentication and data synchronization with blazesportsintel.com
 */

export interface BlazeAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface BlazePlayerStats {
  userId: string;
  gameId: string;
  timestamp: string;
  stats: {
    battingAverage: number;
    homeRuns: number;
    strikeouts: number;
    hits: number;
    atBats: number;
    rbi: number;
    runs: number;
  };
  gameResult: "win" | "loss";
  difficulty: "easy" | "medium" | "hard";
}

export interface BlazeLeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  totalHomeRuns: number;
  totalGames: number;
  winPercentage: number;
  battingAverage: number;
  createdAt: string;
}

export interface BlazeUserProfile {
  userId: string;
  username: string;
  email: string;
  xp: number;
  level: number;
  achievements: string[];
  stats: {
    totalGames: number;
    totalWins: number;
    totalHomeRuns: number;
    totalStrikeouts: number;
    careerBattingAverage: number;
  };
}

export class BlazeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "BlazeAPIError";
  }
}

export class BlazeAPI {
  private baseURL: string;
  private clientId: string;
  private clientSecret: string;
  private apiKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config?: {
    baseURL?: string;
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
  }) {
    this.baseURL =
      config?.baseURL ||
      import.meta.env.VITE_BLAZE_API_URL ||
      "https://api.blazesportsintel.com";
    this.clientId =
      config?.clientId || import.meta.env.VITE_BLAZE_CLIENT_ID || "";
    this.clientSecret =
      config?.clientSecret || import.meta.env.VITE_BLAZE_CLIENT_SECRET || "";
    this.apiKey =
      config?.apiKey || import.meta.env.VITE_BLAZE_API_KEY || "";

    if (!this.clientId || !this.clientSecret || !this.apiKey) {
      console.warn(
        "Blaze API credentials not fully configured. Stats sync will be disabled."
      );
    }
  }

  /**
   * Authenticate with Blaze Sports Intel backend using OAuth2 client credentials flow
   */
  public async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new BlazeAPIError(
          `Authentication failed: ${response.statusText}`,
          response.status
        );
      }

      const data: BlazeAuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Refresh 1 min early

      return this.accessToken;
    } catch (error) {
      if (error instanceof BlazeAPIError) {
        throw error;
      }
      throw new BlazeAPIError(
        `Authentication error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Make authenticated request to Blaze API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-API-Key": this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new BlazeAPIError(
        `API request failed: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  }

  /**
   * Submit game stats to Blaze Sports Intel backend
   */
  public async submitGameStats(stats: BlazePlayerStats): Promise<void> {
    if (!this.clientId) {
      console.warn("Blaze API not configured. Skipping stats submission.");
      return;
    }

    try {
      await this.request<{ success: boolean }>("/v1/games/stats", {
        method: "POST",
        body: JSON.stringify(stats),
      });

      console.log("✅ Game stats submitted to Blaze Sports Intel");
    } catch (error) {
      console.error("❌ Failed to submit stats to Blaze:", error);
      throw error;
    }
  }

  /**
   * Get user profile from Blaze Sports Intel
   */
  public async getUserProfile(userId: string): Promise<BlazeUserProfile> {
    return this.request<BlazeUserProfile>(`/v1/users/${userId}`);
  }

  /**
   * Update user XP and level
   */
  public async updateUserXP(
    userId: string,
    xpGained: number
  ): Promise<{ newXP: number; newLevel: number }> {
    return this.request<{ newXP: number; newLevel: number }>(
      `/v1/users/${userId}/xp`,
      {
        method: "PATCH",
        body: JSON.stringify({ xpGained }),
      }
    );
  }

  /**
   * Get global leaderboard
   */
  public async getLeaderboard(
    category: "homeRuns" | "battingAverage" | "wins" = "homeRuns",
    limit: number = 100
  ): Promise<BlazeLeaderboardEntry[]> {
    return this.request<BlazeLeaderboardEntry[]>(
      `/v1/leaderboard?category=${category}&limit=${limit}`
    );
  }

  /**
   * Register new user
   */
  public async registerUser(
    username: string,
    email: string
  ): Promise<BlazeUserProfile> {
    return this.request<BlazeUserProfile>("/v1/users/register", {
      method: "POST",
      body: JSON.stringify({ username, email }),
    });
  }

  /**
   * Unlock achievement
   */
  public async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<{ unlocked: boolean; newAchievements: string[] }> {
    return this.request<{ unlocked: boolean; newAchievements: string[] }>(
      `/v1/users/${userId}/achievements`,
      {
        method: "POST",
        body: JSON.stringify({ achievementId }),
      }
    );
  }

  /**
   * Health check endpoint
   */
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/v1/health`);
      return response.json();
    } catch (error) {
      throw new BlazeAPIError(
        `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Check if API is configured and available
   */
  public isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.apiKey);
  }
}

// Singleton instance
let blazeAPIInstance: BlazeAPI | null = null;

export function getBlazeAPI(): BlazeAPI {
  if (!blazeAPIInstance) {
    blazeAPIInstance = new BlazeAPI();
  }
  return blazeAPIInstance;
}
