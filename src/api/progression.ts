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

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  async getProgress(playerId: string): Promise<PlayerProgress> {
    const response = await fetch(`${this.baseUrl}/progress/${playerId}`);
    if (!response.ok) throw new Error("Failed to fetch progress");
    return response.json();
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
    }
  ): Promise<PlayerProgress> {
    const response = await fetch(`${this.baseUrl}/game-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, ...result })
    });
    if (!response.ok) throw new Error("Failed to record game result");
    return response.json();
  }
}
