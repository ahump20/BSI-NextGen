/**
 * LeaderboardScreen.ts
 * Displays top 100 players with rankings, stats, and progression data
 */

import { ProgressionAPI, PlayerProgress } from "../api/progression";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorToast } from "./ErrorToast";

interface LeaderboardScreenConfig {
  container: HTMLElement;
  progressionAPI: ProgressionAPI;
  currentPlayerId: string;
  onClose: () => void;
}

interface LeaderboardEntry extends PlayerProgress {
  rank: number;
  win_rate: number;
}

export class LeaderboardScreen {
  private container: HTMLElement;
  private progressionAPI: ProgressionAPI;
  private currentPlayerId: string;
  private onClose: () => void;
  private screenElement: HTMLElement | null = null;
  private leaderboardData: LeaderboardEntry[] = [];
  private isLoading = true;
  private error: string | null = null;
  private searchTerm = "";
  private filterType: "all" | "top10" | "top50" = "all";
  private loadingSpinner: LoadingSpinner;

  constructor(config: LeaderboardScreenConfig) {
    this.container = config.container;
    this.progressionAPI = config.progressionAPI;
    this.currentPlayerId = config.currentPlayerId;
    this.onClose = config.onClose;

    // Initialize loading spinner
    this.loadingSpinner = new LoadingSpinner({
      container: this.container,
      overlay: true,
      size: "medium"
    });
  }

  /**
   * Show leaderboard screen
   */
  public async show(): Promise<void> {
    await this.fetchLeaderboard();
    this.createScreen();
    this.updateUI();

    // Animate entrance
    setTimeout(() => {
      this.screenElement?.classList.add("visible");
    }, 50);
  }

  /**
   * Hide and remove screen
   */
  public hide(): void {
    this.screenElement?.classList.remove("visible");
    setTimeout(() => {
      this.screenElement?.remove();
      this.screenElement = null;
    }, 300);
  }

  /**
   * Fetch leaderboard data from API
   */
  private async fetchLeaderboard(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    // Show loading spinner
    this.loadingSpinner.show("Loading leaderboard...");

    try {
      const response = await this.progressionAPI.getLeaderboard(100);

      // Calculate win rates and add ranks
      this.leaderboardData = response.map((player: PlayerProgress, index: number) => ({
        ...player,
        rank: index + 1,
        win_rate: player.gamesPlayed > 0
          ? (player.wins / player.gamesPlayed) * 100
          : 0
      }));

      this.isLoading = false;
      this.loadingSpinner.hide();
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      this.error = "Failed to load leaderboard. Please try again later.";
      this.isLoading = false;
      this.loadingSpinner.hide();

      // Show error toast
      ErrorToast.error(
        "Failed to load leaderboard. Displaying offline demo data.",
        5000
      );

      // Generate fallback demo data
      this.generateFallbackData();
    }
  }

  /**
   * Generate fallback demo data if API fails
   */
  private generateFallbackData(): void {
    this.leaderboardData = Array.from({ length: 100 }, (_, i) => ({
      playerId: `demo_player_${i + 1}`,
      currentLevel: Math.max(1, 50 - Math.floor(i / 2)),
      experience: Math.max(0, 50000 - i * 500),
      gamesPlayed: Math.max(0, 100 - i),
      wins: Math.max(0, 60 - Math.floor(i * 0.6)),
      losses: Math.max(0, 40 - Math.floor(i * 0.4)),
      totalRuns: Math.max(0, 500 - i * 5),
      totalHits: Math.max(0, 400 - i * 4),
      totalHomeRuns: Math.max(0, 50 - Math.floor(i * 0.5)),
      unlockedCharacters: [],
      unlockedStadiums: [],
      rank: i + 1,
      win_rate: Math.max(0, 60 - i * 0.3)
    }));
  }

  /**
   * Create screen DOM structure
   */
  private createScreen(): void {
    this.screenElement = document.createElement("div");
    this.screenElement.className = "leaderboard-screen";
    this.screenElement.innerHTML = `
      <div class="leaderboard-overlay">
        <div class="leaderboard-content">
          <!-- Header -->
          <div class="leaderboard-header">
            <h1>🏆 Leaderboard</h1>
            <p class="leaderboard-subtitle">Top 100 Players</p>
          </div>

          <!-- Controls -->
          <div class="leaderboard-controls">
            <input
              type="text"
              class="search-input"
              placeholder="Search player ID..."
              value="${this.searchTerm}"
            />
            <div class="filter-buttons">
              <button class="filter-btn ${this.filterType === "all" ? "active" : ""}" data-filter="all">
                All
              </button>
              <button class="filter-btn ${this.filterType === "top10" ? "active" : ""}" data-filter="top10">
                Top 10
              </button>
              <button class="filter-btn ${this.filterType === "top50" ? "active" : ""}" data-filter="top50">
                Top 50
              </button>
            </div>
          </div>

          <!-- Leaderboard Table -->
          <div class="leaderboard-table-container">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Games</th>
                  <th>Wins</th>
                  <th>Win %</th>
                  <th>Runs</th>
                  <th>Hits</th>
                  <th>HRs</th>
                </tr>
              </thead>
              <tbody class="leaderboard-body">
                <!-- Populated by updateUI() -->
              </tbody>
            </table>
          </div>

          <!-- Loading State -->
          <div class="loading-state" style="display: ${this.isLoading ? "flex" : "none"}">
            <div class="loading-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>

          <!-- Error State -->
          <div class="error-state" style="display: ${this.error ? "flex" : "none"}">
            <p class="error-message">${this.error || ""}</p>
            <button class="retry-button">Retry</button>
          </div>

          <!-- Footer Actions -->
          <div class="leaderboard-footer">
            <button class="close-button">Close</button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.injectStyles();
    this.container.appendChild(this.screenElement);
  }

  /**
   * Update UI with leaderboard data
   */
  private updateUI(): void {
    if (!this.screenElement) return;

    const tbody = this.screenElement.querySelector(".leaderboard-body");
    if (!tbody) return;

    // Filter data
    let filteredData = this.leaderboardData;

    // Apply search filter
    if (this.searchTerm) {
      filteredData = filteredData.filter(player =>
        player.playerId.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply rank filter
    if (this.filterType === "top10") {
      filteredData = filteredData.slice(0, 10);
    } else if (this.filterType === "top50") {
      filteredData = filteredData.slice(0, 50);
    }

    // Generate table rows
    tbody.innerHTML = filteredData
      .map(player => {
        const isCurrentPlayer = player.playerId === this.currentPlayerId;
        const rowClass = isCurrentPlayer ? "current-player" : "";

        return `
          <tr class="${rowClass}">
            <td class="rank-cell">
              ${player.rank <= 3 ? this.getMedalEmoji(player.rank) : `#${player.rank}`}
            </td>
            <td class="player-cell">
              ${player.playerId}
              ${isCurrentPlayer ? '<span class="you-badge">YOU</span>' : ""}
            </td>
            <td>${player.currentLevel}</td>
            <td>${player.experience.toLocaleString()}</td>
            <td>${player.gamesPlayed}</td>
            <td>${player.wins}</td>
            <td>${player.win_rate.toFixed(1)}%</td>
            <td>${player.totalRuns}</td>
            <td>${player.totalHits}</td>
            <td>${player.totalHomeRuns}</td>
          </tr>
        `;
      })
      .join("");

    // Show "no results" message if filtered data is empty
    if (filteredData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="no-results">
            No players found matching "${this.searchTerm}"
          </td>
        </tr>
      `;
    }

    // Update loading/error states
    const loadingState = this.screenElement.querySelector(".loading-state") as HTMLElement;
    const errorState = this.screenElement.querySelector(".error-state") as HTMLElement;

    if (loadingState) {
      loadingState.style.display = this.isLoading ? "flex" : "none";
    }

    if (errorState) {
      errorState.style.display = this.error ? "flex" : "none";
      const errorMessage = errorState.querySelector(".error-message");
      if (errorMessage) {
        errorMessage.textContent = this.error || "";
      }
    }
  }

  /**
   * Get medal emoji for top 3 ranks
   */
  private getMedalEmoji(rank: number): string {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.screenElement) return;

    // Close button
    const closeButton = this.screenElement.querySelector(".close-button");
    closeButton?.addEventListener("click", () => {
      this.hide();
      this.onClose();
    });

    // Retry button
    const retryButton = this.screenElement.querySelector(".retry-button");
    retryButton?.addEventListener("click", async () => {
      await this.fetchLeaderboard();
      this.updateUI();
    });

    // Search input
    const searchInput = this.screenElement.querySelector(".search-input") as HTMLInputElement;
    searchInput?.addEventListener("input", (e) => {
      this.searchTerm = (e.target as HTMLInputElement).value;
      this.updateUI();
    });

    // Filter buttons
    const filterButtons = this.screenElement.querySelectorAll(".filter-btn");
    filterButtons.forEach(button => {
      button.addEventListener("click", () => {
        const filter = button.getAttribute("data-filter") as "all" | "top10" | "top50";
        this.filterType = filter;

        // Update active state
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        this.updateUI();
      });
    });
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {
    if (document.getElementById("leaderboard-screen-styles")) return;

    const style = document.createElement("style");
    style.id = "leaderboard-screen-styles";
    style.textContent = `
      .leaderboard-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .leaderboard-screen.visible {
        opacity: 1;
      }

      .leaderboard-overlay {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg,
          rgba(10, 10, 30, 0.95) 0%,
          rgba(20, 20, 50, 0.95) 100%
        );
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow: auto;
      }

      .leaderboard-content {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 40px;
        max-width: 1200px;
        width: 100%;
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-height: 90vh;
        overflow-y: auto;
      }

      .leaderboard-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .leaderboard-header h1 {
        font-size: 48px;
        margin: 0 0 10px 0;
        color: #fff;
        text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
      }

      .leaderboard-subtitle {
        font-size: 18px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
      }

      .leaderboard-controls {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .search-input {
        flex: 1;
        min-width: 200px;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        color: white;
        font-size: 16px;
        outline: none;
        transition: all 0.3s ease;
      }

      .search-input:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 215, 0, 0.5);
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
      }

      .search-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .filter-buttons {
        display: flex;
        gap: 10px;
      }

      .filter-btn {
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .filter-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }

      .filter-btn.active {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #000;
        border-color: #ffd700;
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
      }

      .leaderboard-table-container {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 30px;
        overflow-x: auto;
      }

      .leaderboard-table {
        width: 100%;
        border-collapse: collapse;
        color: white;
      }

      .leaderboard-table thead {
        background: rgba(255, 255, 255, 0.1);
      }

      .leaderboard-table th {
        padding: 15px 10px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: rgba(255, 255, 255, 0.8);
        border-bottom: 2px solid rgba(255, 215, 0, 0.3);
      }

      .leaderboard-table td {
        padding: 15px 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .leaderboard-table tr {
        transition: background 0.2s ease;
      }

      .leaderboard-table tbody tr:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .leaderboard-table tr.current-player {
        background: rgba(255, 215, 0, 0.1);
        border: 2px solid rgba(255, 215, 0, 0.3);
      }

      .rank-cell {
        font-size: 18px;
        font-weight: bold;
        color: #ffd700;
      }

      .player-cell {
        font-weight: 600;
        position: relative;
      }

      .you-badge {
        display: inline-block;
        margin-left: 10px;
        padding: 2px 8px;
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #000;
        font-size: 10px;
        font-weight: bold;
        border-radius: 5px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .no-results {
        text-align: center;
        padding: 40px !important;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
      }

      .loading-state,
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: white;
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.2);
        border-top-color: #ffd700;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .error-message {
        font-size: 18px;
        color: #ff6b6b;
        margin-bottom: 20px;
      }

      .retry-button {
        padding: 12px 32px;
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        border: none;
        border-radius: 10px;
        color: #000;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .retry-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
      }

      .leaderboard-footer {
        display: flex;
        justify-content: center;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .close-button {
        padding: 15px 60px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: white;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .leaderboard-content {
          padding: 20px;
        }

        .leaderboard-header h1 {
          font-size: 32px;
        }

        .leaderboard-controls {
          flex-direction: column;
        }

        .search-input {
          width: 100%;
        }

        .filter-buttons {
          width: 100%;
          justify-content: space-between;
        }

        .filter-btn {
          flex: 1;
          padding: 10px;
          font-size: 12px;
        }

        .leaderboard-table {
          font-size: 12px;
        }

        .leaderboard-table th,
        .leaderboard-table td {
          padding: 10px 5px;
        }

        .close-button {
          width: 100%;
          padding: 15px 20px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
