import { ProgressionAPI, PlayerProgress } from "../api/progression";
import { getNewUnlocks, UnlockReward, getRarityColor } from "../systems/UnlockSystem";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorToast } from "./ErrorToast";

interface PostGameScreenConfig {
  container: HTMLElement;
  progressionAPI: ProgressionAPI;
  playerId: string;
  gameResult: {
    won: boolean;
    finalScore: { home: number; away: number };
    runsScored: number;
    hitsRecorded: number;
    homeRunsHit: number;
  };
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

interface GameResultResponse extends PlayerProgress {
  xp_gained: number;
  leveled_up: boolean;
}

export class PostGameScreen {
  private container: HTMLElement;
  private progressionAPI: ProgressionAPI;
  private playerId: string;
  private gameResult: PostGameScreenConfig["gameResult"];
  private onPlayAgain: () => void;
  private onViewLeaderboard: () => void;

  private screenElement: HTMLDivElement | null = null;
  private resultData: GameResultResponse | null = null;
  private newUnlocks: { characters: UnlockReward[]; stadiums: UnlockReward[] } = {
    characters: [],
    stadiums: []
  };
  private loadingSpinner: LoadingSpinner;

  constructor(config: PostGameScreenConfig) {
    this.container = config.container;
    this.progressionAPI = config.progressionAPI;
    this.playerId = config.playerId;
    this.gameResult = config.gameResult;
    this.onPlayAgain = config.onPlayAgain;
    this.onViewLeaderboard = config.onViewLeaderboard;

    // Initialize loading spinner
    this.loadingSpinner = new LoadingSpinner({
      container: this.container,
      overlay: true,
      size: "medium"
    });
  }

  /**
   * Show the post-game screen and submit results
   */
  public async show(): Promise<void> {
    // Submit game result to backend
    await this.submitGameResult();

    // Create and display the screen
    this.createScreen();
    this.updateUI();

    // Animate entrance
    setTimeout(() => {
      if (this.screenElement) {
        this.screenElement.classList.add("visible");
      }
    }, 100);
  }

  /**
   * Hide and remove the post-game screen
   */
  public hide(): void {
    if (this.screenElement && this.screenElement.parentElement) {
      this.screenElement.classList.remove("visible");
      setTimeout(() => {
        this.screenElement?.remove();
        this.screenElement = null;
      }, 300);
    }
  }

  /**
   * Submit game result to API and store response
   */
  private async submitGameResult(): Promise<void> {
    this.loadingSpinner.show("Submitting game results...");

    try {
      const result = await this.progressionAPI.recordGameResult(this.playerId, {
        won: this.gameResult.won,
        runsScored: this.gameResult.runsScored,
        hitsRecorded: this.gameResult.hitsRecorded,
        homeRunsHit: this.gameResult.homeRunsHit
      });

      this.resultData = result as GameResultResponse;
      console.log("Game result submitted:", this.resultData);

      // Check for new unlocks
      this.newUnlocks = getNewUnlocks(this.resultData);
      console.log("New unlocks:", this.newUnlocks);

      this.loadingSpinner.hide();
    } catch (error) {
      console.error("Failed to submit game result:", error);
      this.loadingSpinner.hide();

      // Show error toast
      ErrorToast.error(
        "Failed to submit game results. Displaying offline mode.",
        5000
      );

      // Create fallback data so screen can still display
      this.resultData = {
        playerId: this.playerId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        totalRuns: 0,
        totalHits: 0,
        totalHomeRuns: 0,
        unlockedCharacters: [],
        unlockedStadiums: [],
        currentLevel: 1,
        experience: 0,
        xp_gained: 0,
        leveled_up: false
      };
    }
  }

  /**
   * Create the HTML structure for the post-game screen
   */
  private createScreen(): void {
    this.screenElement = document.createElement("div");
    this.screenElement.id = "postgame-screen";
    this.screenElement.innerHTML = `
      <div class="postgame-overlay">
        <div class="postgame-content">
          <!-- Result Header -->
          <div id="result-header" class="result-header">
            <h1 class="result-title">You Won!</h1>
            <div class="final-score">0 - 0</div>
          </div>

          <!-- Stats Summary -->
          <div class="stats-summary">
            <div class="stat-card">
              <div class="stat-icon">⚾</div>
              <div class="stat-value">0</div>
              <div class="stat-label">Hits</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🏃</div>
              <div class="stat-value">0</div>
              <div class="stat-label">Runs</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💥</div>
              <div class="stat-value">0</div>
              <div class="stat-label">Home Runs</div>
            </div>
          </div>

          <!-- XP Progress -->
          <div class="xp-section">
            <h2>Experience Gained</h2>
            <div id="xp-breakdown" class="xp-breakdown"></div>
            <div class="xp-progress-bar">
              <div id="xp-progress-fill" class="xp-progress-fill"></div>
            </div>
            <div id="xp-info" class="xp-info"></div>
          </div>

          <!-- Level Up Notification -->
          <div id="level-up-notification" class="level-up-notification hidden">
            <div class="level-up-content">
              <div class="level-up-icon">🎉</div>
              <h2 class="level-up-title">Level Up!</h2>
              <div id="level-up-text" class="level-up-text"></div>
            </div>
          </div>

          <!-- Player Record -->
          <div class="player-record">
            <h3>Career Stats</h3>
            <div id="career-stats" class="career-stats-grid"></div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button id="play-again-btn" class="action-button primary">
              🎮 Play Again
            </button>
            <button id="leaderboard-btn" class="action-button secondary">
              🏆 View Leaderboard
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.screenElement);

    // Attach event listeners
    this.attachEventListeners();

    // Apply styles
    this.applyStyles();
  }

  /**
   * Attach event listeners to interactive elements
   */
  private attachEventListeners(): void {
    if (!this.screenElement) return;

    const playAgainBtn = this.screenElement.querySelector("#play-again-btn");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => {
        this.hide();
        this.onPlayAgain();
      });
    }

    const leaderboardBtn = this.screenElement.querySelector("#leaderboard-btn");
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener("click", () => {
        this.hide();
        this.onViewLeaderboard();
      });
    }
  }

  /**
   * Update UI with game result data
   */
  private updateUI(): void {
    if (!this.screenElement || !this.resultData) return;

    // Update result header
    this.updateResultHeader();

    // Update stats cards
    this.updateStatsCards();

    // Update XP progress
    this.updateXPProgress();

    // Show level up notification if applicable
    if (this.resultData.leveled_up) {
      this.showLevelUpNotification();
    }

    // Show unlock notifications if any
    const totalUnlocks = this.newUnlocks.characters.length + this.newUnlocks.stadiums.length;
    if (totalUnlocks > 0) {
      this.showUnlockNotifications();
    }

    // Update career stats
    this.updateCareerStats();
  }

  /**
   * Update result header (win/loss and score)
   */
  private updateResultHeader(): void {
    const header = this.screenElement?.querySelector("#result-header");
    if (!header) return;

    const title = header.querySelector(".result-title") as HTMLElement;
    const scoreDisplay = header.querySelector(".final-score") as HTMLElement;

    if (this.gameResult.won) {
      title.textContent = "🏆 You Won! 🏆";
      title.classList.add("win");
      header.classList.add("win");
    } else {
      title.textContent = "😔 You Lost";
      title.classList.add("loss");
      header.classList.add("loss");
    }

    scoreDisplay.textContent = `${this.gameResult.finalScore.away} - ${this.gameResult.finalScore.home}`;
  }

  /**
   * Update stats cards with game performance
   */
  private updateStatsCards(): void {
    const statCards = this.screenElement?.querySelectorAll(".stat-card");
    if (!statCards || statCards.length !== 3) return;

    const stats = [
      this.gameResult.hitsRecorded,
      this.gameResult.runsScored,
      this.gameResult.homeRunsHit
    ];

    statCards.forEach((card, index) => {
      const valueElement = card.querySelector(".stat-value") as HTMLElement;
      if (valueElement) {
        this.animateNumber(valueElement, 0, stats[index], 1000);
      }
    });
  }

  /**
   * Update XP progress display
   */
  private updateXPProgress(): void {
    if (!this.resultData) return;

    // XP breakdown
    const breakdown = this.screenElement?.querySelector("#xp-breakdown");
    if (breakdown) {
      breakdown.innerHTML = `
        <div class="xp-item">
          <span class="xp-label">Game Completion:</span>
          <span class="xp-value">+100 XP</span>
        </div>
        ${this.gameResult.won ? '<div class="xp-item"><span class="xp-label">Victory Bonus:</span><span class="xp-value">+50 XP</span></div>' : ''}
        <div class="xp-item">
          <span class="xp-label">Runs (${this.gameResult.runsScored} × 5):</span>
          <span class="xp-value">+${this.gameResult.runsScored * 5} XP</span>
        </div>
        <div class="xp-item">
          <span class="xp-label">Hits (${this.gameResult.hitsRecorded} × 3):</span>
          <span class="xp-value">+${this.gameResult.hitsRecorded * 3} XP</span>
        </div>
        <div class="xp-item">
          <span class="xp-label">Home Runs (${this.gameResult.homeRunsHit} × 10):</span>
          <span class="xp-value">+${this.gameResult.homeRunsHit * 10} XP</span>
        </div>
        <div class="xp-total">
          <span class="xp-label">Total XP Gained:</span>
          <span class="xp-value">+${this.resultData.xp_gained} XP</span>
        </div>
      `;
    }

    // Progress bar
    const progressFill = this.screenElement?.querySelector("#xp-progress-fill") as HTMLElement;
    const xpInfo = this.screenElement?.querySelector("#xp-info");

    if (progressFill && xpInfo) {
      const currentXP = this.resultData.experience % 1000;
      const progressPercent = (currentXP / 1000) * 100;

      progressFill.style.width = `${progressPercent}%`;
      xpInfo.textContent = `Level ${this.resultData.currentLevel} - ${currentXP} / 1000 XP`;
    }
  }

  /**
   * Show level up notification with animation
   */
  private showLevelUpNotification(): void {
    if (!this.resultData) return;

    const notification = this.screenElement?.querySelector("#level-up-notification");
    const levelText = this.screenElement?.querySelector("#level-up-text");

    if (notification && levelText) {
      levelText.textContent = `You reached Level ${this.resultData.currentLevel}!`;

      setTimeout(() => {
        notification.classList.remove("hidden");
        notification.classList.add("show");

        // Hide after 4 seconds
        setTimeout(() => {
          notification.classList.remove("show");
          setTimeout(() => {
            notification.classList.add("hidden");
          }, 500);
        }, 4000);
      }, 1500);
    }
  }

  /**
   * Show unlock notifications for newly unlocked characters and stadiums
   */
  private showUnlockNotifications(): void {
    const allUnlocks = [
      ...this.newUnlocks.characters.map(u => ({ ...u, icon: "⭐" })),
      ...this.newUnlocks.stadiums.map(u => ({ ...u, icon: "🏟️" }))
    ];

    if (allUnlocks.length === 0) return;

    // Create notification container
    const notificationContainer = document.createElement("div");
    notificationContainer.id = "unlock-notifications-container";
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 4000;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 400px;
    `;

    this.container.appendChild(notificationContainer);

    // Show each unlock notification with staggered timing
    allUnlocks.forEach((unlock, index) => {
      setTimeout(() => {
        this.showSingleUnlockNotification(notificationContainer, unlock, index);
      }, (this.resultData?.leveled_up ? 4500 : 1500) + (index * 500)); // Delay after level up if applicable
    });

    // Remove container after all notifications are done
    setTimeout(() => {
      notificationContainer.remove();
    }, (this.resultData?.leveled_up ? 4500 : 1500) + (allUnlocks.length * 500) + 5000);
  }

  /**
   * Show a single unlock notification
   */
  private showSingleUnlockNotification(
    container: HTMLElement,
    unlock: UnlockReward & { icon: string },
    index: number
  ): void {
    const notification = document.createElement("div");
    notification.className = "unlock-notification";
    notification.style.cssText = `
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 240, 0.95) 100%);
      border-left: 4px solid ${getRarityColor(unlock.rarity)};
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 3rem;">${unlock.icon}</div>
        <div style="flex: 1;">
          <div style="font-size: 0.85rem; color: ${getRarityColor(unlock.rarity)}; font-weight: bold; text-transform: uppercase; margin-bottom: 0.25rem;">
            ${unlock.rarity} ${unlock.type} unlocked!
          </div>
          <div style="font-size: 1.3rem; font-weight: bold; color: #333; margin-bottom: 0.5rem;">
            ${unlock.name}
          </div>
          <div style="font-size: 0.9rem; color: #666;">
            ${unlock.conditions.map(c => c.description).join(" & ")}
          </div>
        </div>
      </div>
    `;

    container.appendChild(notification);

    // Animate entrance
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // Animate exit and remove
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100px)";
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 4500);
  }

  /**
   * Update career stats display
   */
  private updateCareerStats(): void {
    if (!this.resultData) return;

    const careerStats = this.screenElement?.querySelector("#career-stats");
    if (!careerStats) return;

    const winRate = this.resultData.gamesPlayed > 0
      ? ((this.resultData.wins / this.resultData.gamesPlayed) * 100).toFixed(1)
      : "0.0";

    careerStats.innerHTML = `
      <div class="career-stat">
        <span class="career-label">Games Played:</span>
        <span class="career-value">${this.resultData.gamesPlayed}</span>
      </div>
      <div class="career-stat">
        <span class="career-label">Record:</span>
        <span class="career-value">${this.resultData.wins}-${this.resultData.losses}</span>
      </div>
      <div class="career-stat">
        <span class="career-label">Win Rate:</span>
        <span class="career-value">${winRate}%</span>
      </div>
      <div class="career-stat">
        <span class="career-label">Total Runs:</span>
        <span class="career-value">${this.resultData.totalRuns}</span>
      </div>
      <div class="career-stat">
        <span class="career-label">Total Hits:</span>
        <span class="career-value">${this.resultData.totalHits}</span>
      </div>
      <div class="career-stat">
        <span class="career-label">Total Home Runs:</span>
        <span class="career-value">${this.resultData.totalHomeRuns}</span>
      </div>
    `;
  }

  /**
   * Animate a number from start to end
   */
  private animateNumber(element: HTMLElement, start: number, end: number, duration: number): void {
    const startTime = Date.now();

    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease out cubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const current = Math.floor(start + (end - start) * easedProgress);
      element.textContent = current.toString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    update();
  }

  /**
   * Apply CSS styles to the post-game screen
   */
  private applyStyles(): void {
    if (document.getElementById("postgame-styles")) return;

    const style = document.createElement("style");
    style.id = "postgame-styles";
    style.textContent = `
      #postgame-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2000;
        font-family: 'Arial', sans-serif;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      #postgame-screen.visible {
        opacity: 1;
      }

      .postgame-overlay {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(26, 42, 58, 0.95) 0%, rgba(45, 74, 94, 0.95) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 2rem;
      }

      .postgame-content {
        max-width: 800px;
        width: 100%;
        background: white;
        border-radius: 20px;
        padding: 3rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }

      #postgame-screen.visible .postgame-content {
        transform: scale(1);
      }

      .result-header {
        text-align: center;
        margin-bottom: 2rem;
        padding: 2rem;
        border-radius: 15px;
        background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
      }

      .result-header.win {
        background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
      }

      .result-header.loss {
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      }

      .result-title {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: #333;
      }

      .result-title.win {
        color: #ff6b00;
      }

      .result-title.loss {
        color: #c62828;
      }

      .final-score {
        font-size: 3rem;
        font-weight: bold;
        color: #666;
        font-family: monospace;
      }

      .stats-summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: linear-gradient(135deg, #fff 0%, #f5f5f5 100%);
        border-radius: 15px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #ff6b00;
        margin-bottom: 0.25rem;
      }

      .stat-label {
        font-size: 0.9rem;
        color: #666;
      }

      .xp-section {
        background: #f5f5f5;
        border-radius: 15px;
        padding: 2rem;
        margin-bottom: 2rem;
      }

      .xp-section h2 {
        font-size: 1.5rem;
        color: #333;
        margin-bottom: 1rem;
        text-align: center;
      }

      .xp-breakdown {
        margin-bottom: 1rem;
      }

      .xp-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #ddd;
      }

      .xp-total {
        display: flex;
        justify-content: space-between;
        padding: 1rem 0;
        margin-top: 1rem;
        border-top: 2px solid #ff6b00;
        font-weight: bold;
        font-size: 1.1rem;
      }

      .xp-label {
        color: #666;
      }

      .xp-value {
        color: #ff6b00;
        font-weight: bold;
      }

      .xp-progress-bar {
        width: 100%;
        height: 30px;
        background: #ddd;
        border-radius: 15px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }

      .xp-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff6b00 0%, #ff8c3a 100%);
        transition: width 1s ease;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 10px;
        color: white;
        font-weight: bold;
      }

      .xp-info {
        text-align: center;
        color: #666;
        font-size: 0.95rem;
      }

      .level-up-notification {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%);
        border-radius: 20px;
        padding: 3rem;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        opacity: 0;
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .level-up-notification.show {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }

      .level-up-notification.hidden {
        display: none;
      }

      .level-up-content {
        text-align: center;
      }

      .level-up-icon {
        font-size: 5rem;
        margin-bottom: 1rem;
        animation: bounce 0.6s infinite alternate;
      }

      @keyframes bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-10px); }
      }

      .level-up-title {
        font-size: 3rem;
        color: #333;
        margin-bottom: 0.5rem;
      }

      .level-up-text {
        font-size: 1.5rem;
        color: #666;
      }

      .player-record {
        background: #f5f5f5;
        border-radius: 15px;
        padding: 2rem;
        margin-bottom: 2rem;
      }

      .player-record h3 {
        font-size: 1.3rem;
        color: #333;
        margin-bottom: 1rem;
        text-align: center;
      }

      .career-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .career-stat {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem;
        background: white;
        border-radius: 8px;
      }

      .career-label {
        color: #666;
      }

      .career-value {
        color: #ff6b00;
        font-weight: bold;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .action-button {
        padding: 1.25rem;
        font-size: 1.2rem;
        font-weight: bold;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .action-button.primary {
        background: linear-gradient(135deg, #ff6b00 0%, #ff8c3a 100%);
        color: white;
      }

      .action-button.primary:hover {
        background: linear-gradient(135deg, #ff8c3a 0%, #ffa366 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 107, 0, 0.4);
      }

      .action-button.secondary {
        background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%);
        color: white;
      }

      .action-button.secondary:hover {
        background: linear-gradient(135deg, #42A5F5 0%, #64B5F6 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
      }

      @media (max-width: 768px) {
        .postgame-content {
          padding: 1.5rem;
        }

        .result-title {
          font-size: 2rem;
        }

        .final-score {
          font-size: 2.5rem;
        }

        .stats-summary {
          grid-template-columns: 1fr;
        }

        .career-stats-grid {
          grid-template-columns: 1fr;
        }

        .action-buttons {
          grid-template-columns: 1fr;
        }

        .level-up-notification {
          padding: 2rem;
          width: 90%;
        }

        .level-up-title {
          font-size: 2rem;
        }

        .level-up-text {
          font-size: 1.2rem;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
