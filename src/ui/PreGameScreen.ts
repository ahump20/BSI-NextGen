import { Player, Stadium } from "../core/GameEngine";
import { ORIGINAL_CHARACTERS, UNLOCKABLE_CHARACTERS } from "../data/characters";
import { STADIUMS } from "../data/stadiums";
import { ProgressionAPI } from "../api/progression";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorToast } from "./ErrorToast";

interface PreGameScreenConfig {
  container: HTMLElement;
  progressionAPI: ProgressionAPI;
  playerId: string;
  onStartGame: (selectedCharacter: Player, selectedStadium: Stadium) => void;
  onViewChampionships?: () => void; // Optional callback to view championship dashboard
}

export class PreGameScreen {
  private container: HTMLElement;
  private progressionAPI: ProgressionAPI;
  private playerId: string;
  private onStartGame: (character: Player, stadium: Stadium) => void;
  private onViewChampionships?: () => void;

  private availableCharacters: Player[] = [];
  private availableStadiums: Stadium[] = [];

  private selectedCharacter: Player | null = null;
  private selectedStadium: Stadium | null = null;

  private screenElement: HTMLDivElement | null = null;
  private loadingSpinner: LoadingSpinner;

  constructor(config: PreGameScreenConfig) {
    this.container = config.container;
    this.progressionAPI = config.progressionAPI;
    this.playerId = config.playerId;
    this.onStartGame = config.onStartGame;
    this.onViewChampionships = config.onViewChampionships;

    // Initialize loading spinner
    this.loadingSpinner = new LoadingSpinner({
      container: this.container,
      overlay: true,
      size: "medium"
    });
  }

  /**
   * Initialize and display the pre-game screen
   */
  public async show(): Promise<void> {
    // Load player progress to determine unlocked content
    await this.loadUnlockedContent();

    // Create the screen UI
    this.createScreen();

    // Default selections
    this.selectedCharacter = this.availableCharacters[0] || null;
    this.selectedStadium = this.availableStadiums[0] || null;

    this.updateUI();
  }

  /**
   * Hide and remove the pre-game screen
   */
  public hide(): void {
    if (this.screenElement && this.screenElement.parentElement) {
      this.screenElement.remove();
      this.screenElement = null;
    }
  }

  /**
   * Load player progress and determine unlocked characters/stadiums
   */
  private async loadUnlockedContent(): Promise<void> {
    // Show loading spinner
    this.loadingSpinner.show("Loading your unlocked content...");

    try {
      const progress = await this.progressionAPI.getProgress(this.playerId);

      // Start with original characters (always available)
      this.availableCharacters = [...ORIGINAL_CHARACTERS];

      // Add unlocked secret characters
      const unlockedCharacterIds = progress.unlockedCharacters || [];
      const unlockedSecretCharacters = UNLOCKABLE_CHARACTERS.filter(char =>
        unlockedCharacterIds.includes(char.id)
      );
      this.availableCharacters.push(...unlockedSecretCharacters);

      // Start with first stadium (always available)
      this.availableStadiums = [STADIUMS[0]];

      // Add unlocked stadiums
      const unlockedStadiumIds = progress.unlockedStadiums || [];
      const unlockedStadiums = STADIUMS.filter(stadium =>
        unlockedStadiumIds.includes(stadium.id)
      );
      this.availableStadiums.push(...unlockedStadiums);

      // Remove duplicates (in case first stadium is also in unlocked list)
      this.availableStadiums = Array.from(
        new Map(this.availableStadiums.map(s => [s.id, s])).values()
      );

      this.loadingSpinner.hide();
    } catch (error) {
      console.error("Failed to load player progress:", error);
      this.loadingSpinner.hide();

      // Show error toast
      ErrorToast.error(
        "Failed to load your progress. Using default content.",
        5000
      );

      // Fallback: use all original content
      this.availableCharacters = [...ORIGINAL_CHARACTERS];
      this.availableStadiums = [STADIUMS[0]];
    }
  }

  /**
   * Create the HTML structure for the pre-game screen
   */
  private createScreen(): void {
    this.screenElement = document.createElement("div");
    this.screenElement.id = "pregame-screen";
    this.screenElement.innerHTML = `
      <div class="pregame-overlay">
        <div class="pregame-content">
          <h1 class="pregame-title">⚾ Sandlot Sluggers ⚾</h1>

          <div class="pregame-section">
            <h2>Select Your Character</h2>
            <div id="character-grid" class="selection-grid"></div>
            <div id="character-stats" class="stats-panel"></div>
          </div>

          <div class="pregame-section">
            <h2>Select Your Stadium</h2>
            <div id="stadium-grid" class="selection-grid"></div>
            <div id="stadium-info" class="info-panel"></div>
          </div>

          <div class="button-row">
            <button id="start-game-btn" class="start-button" disabled>
              Start Game
            </button>
            <button id="view-championships-btn" class="secondary-button">
              📊 Cardinals Championships
            </button>
          </div>

          <div class="unlock-hint">
            🏆 Win games to unlock new characters and stadiums!
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.screenElement);

    // Add event listeners
    this.attachEventListeners();

    // Apply styles
    this.applyStyles();
  }

  /**
   * Attach event listeners to interactive elements
   */
  private attachEventListeners(): void {
    if (!this.screenElement) return;

    // Start game button
    const startBtn = this.screenElement.querySelector("#start-game-btn") as HTMLButtonElement;
    if (startBtn) {
      startBtn.addEventListener("click", () => this.handleStartGame());
    }

    // Championships button
    const championshipsBtn = this.screenElement.querySelector("#view-championships-btn") as HTMLButtonElement;
    if (championshipsBtn && this.onViewChampionships) {
      championshipsBtn.addEventListener("click", () => {
        if (this.onViewChampionships) {
          this.onViewChampionships();
        }
      });
    }
  }

  /**
   * Update UI with current selections
   */
  private updateUI(): void {
    this.renderCharacters();
    this.renderStadiums();
    this.updateCharacterStats();
    this.updateStadiumInfo();
    this.updateStartButton();
  }

  /**
   * Render character selection grid
   */
  private renderCharacters(): void {
    const grid = this.screenElement?.querySelector("#character-grid");
    if (!grid) return;

    grid.innerHTML = "";

    this.availableCharacters.forEach(character => {
      const card = document.createElement("div");
      card.className = "selection-card";
      if (this.selectedCharacter?.id === character.id) {
        card.classList.add("selected");
      }

      // Check if character is unlockable
      const isSecret = UNLOCKABLE_CHARACTERS.some(c => c.id === character.id);

      card.innerHTML = `
        <div class="card-header">
          <span class="card-name">${character.name}</span>
          ${isSecret ? '<span class="secret-badge">🌟 SECRET</span>' : ''}
        </div>
        <div class="card-position">${character.position}</div>
        <div class="card-preview">
          <div class="preview-icon">⚾</div>
        </div>
      `;

      card.addEventListener("click", () => {
        this.selectedCharacter = character;
        this.updateUI();
      });

      grid.appendChild(card);
    });
  }

  /**
   * Render stadium selection grid
   */
  private renderStadiums(): void {
    const grid = this.screenElement?.querySelector("#stadium-grid");
    if (!grid) return;

    grid.innerHTML = "";

    this.availableStadiums.forEach(stadium => {
      const card = document.createElement("div");
      card.className = "selection-card";
      if (this.selectedStadium?.id === stadium.id) {
        card.classList.add("selected");
      }

      card.innerHTML = `
        <div class="card-header">
          <span class="card-name">${stadium.name}</span>
        </div>
        <div class="card-description">${stadium.description}</div>
        <div class="card-dimensions">
          ${stadium.dimensions.leftField}' | ${stadium.dimensions.centerField}' | ${stadium.dimensions.rightField}'
        </div>
      `;

      card.addEventListener("click", () => {
        this.selectedStadium = stadium;
        this.updateUI();
      });

      grid.appendChild(card);
    });
  }

  /**
   * Update character stats display
   */
  private updateCharacterStats(): void {
    const statsPanel = this.screenElement?.querySelector("#character-stats");
    if (!statsPanel || !this.selectedCharacter) return;

    const char = this.selectedCharacter;

    statsPanel.innerHTML = `
      <h3>${char.name} - ${char.position}</h3>
      <div class="stat-row">
        <span class="stat-label">⚡ Batting Power:</span>
        <span class="stat-bar">${this.createStatBar(char.battingPower)}</span>
        <span class="stat-value">${char.battingPower}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">🎯 Batting Accuracy:</span>
        <span class="stat-bar">${this.createStatBar(char.battingAccuracy)}</span>
        <span class="stat-value">${char.battingAccuracy}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">💨 Speed:</span>
        <span class="stat-bar">${this.createStatBar(char.speed)}</span>
        <span class="stat-value">${char.speed}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">🔥 Pitch Speed:</span>
        <span class="stat-bar">${this.createStatBar(char.pitchSpeed)}</span>
        <span class="stat-value">${char.pitchSpeed}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">🎯 Pitch Control:</span>
        <span class="stat-bar">${this.createStatBar(char.pitchControl)}</span>
        <span class="stat-value">${char.pitchControl}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">🧤 Fielding Range:</span>
        <span class="stat-bar">${this.createStatBar(char.fieldingRange)}</span>
        <span class="stat-value">${char.fieldingRange}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">✨ Fielding Accuracy:</span>
        <span class="stat-bar">${this.createStatBar(char.fieldingAccuracy)}</span>
        <span class="stat-value">${char.fieldingAccuracy}</span>
      </div>
    `;
  }

  /**
   * Create a visual stat bar (0-10 scale)
   */
  private createStatBar(value: number): string {
    const filled = Math.round((value / 10) * 10);
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  }

  /**
   * Update stadium info display
   */
  private updateStadiumInfo(): void {
    const infoPanel = this.screenElement?.querySelector("#stadium-info");
    if (!infoPanel || !this.selectedStadium) return;

    const stadium = this.selectedStadium;

    infoPanel.innerHTML = `
      <h3>${stadium.name}</h3>
      <p class="stadium-description">${stadium.description}</p>
      <div class="dimensions-display">
        <div class="dimension-item">
          <span class="dimension-label">Left Field</span>
          <span class="dimension-value">${stadium.dimensions.leftField} ft</span>
        </div>
        <div class="dimension-item">
          <span class="dimension-label">Center Field</span>
          <span class="dimension-value">${stadium.dimensions.centerField} ft</span>
        </div>
        <div class="dimension-item">
          <span class="dimension-label">Right Field</span>
          <span class="dimension-value">${stadium.dimensions.rightField} ft</span>
        </div>
      </div>
    `;
  }

  /**
   * Update start button state
   */
  private updateStartButton(): void {
    const startBtn = this.screenElement?.querySelector("#start-game-btn") as HTMLButtonElement;
    if (!startBtn) return;

    if (this.selectedCharacter && this.selectedStadium) {
      startBtn.disabled = false;
      startBtn.textContent = `Start Game with ${this.selectedCharacter.name}`;
    } else {
      startBtn.disabled = true;
      startBtn.textContent = "Select character and stadium";
    }
  }

  /**
   * Handle start game button click
   */
  private handleStartGame(): void {
    if (!this.selectedCharacter || !this.selectedStadium) {
      console.warn("Cannot start game without character and stadium selected");
      return;
    }

    console.log("Starting game with:", {
      character: this.selectedCharacter.name,
      stadium: this.selectedStadium.name
    });

    this.hide();
    this.onStartGame(this.selectedCharacter, this.selectedStadium);
  }

  /**
   * Apply CSS styles to the pre-game screen
   */
  private applyStyles(): void {
    if (document.getElementById("pregame-styles")) return;

    const style = document.createElement("style");
    style.id = "pregame-styles";
    style.textContent = `
      #pregame-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1000;
        font-family: 'Arial', sans-serif;
      }

      .pregame-overlay {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a2a3a 0%, #2d4a5e 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: 2rem;
      }

      .pregame-content {
        max-width: 1200px;
        width: 100%;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 3rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .pregame-title {
        text-align: center;
        font-size: 3rem;
        color: #ff6b00;
        margin-bottom: 2rem;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      }

      .pregame-section {
        margin-bottom: 3rem;
      }

      .pregame-section h2 {
        font-size: 1.8rem;
        color: #333;
        margin-bottom: 1rem;
        border-bottom: 3px solid #ff6b00;
        padding-bottom: 0.5rem;
      }

      .selection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .selection-card {
        background: white;
        border: 3px solid #ddd;
        border-radius: 12px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
      }

      .selection-card:hover {
        border-color: #ff6b00;
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(255, 107, 0, 0.2);
      }

      .selection-card.selected {
        border-color: #ff6b00;
        background: linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%);
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .card-name {
        font-weight: bold;
        font-size: 1.1rem;
        color: #333;
      }

      .secret-badge {
        font-size: 0.7rem;
        background: #ffeb3b;
        padding: 0.2rem 0.5rem;
        border-radius: 8px;
        color: #333;
      }

      .card-position {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.5rem;
      }

      .card-preview {
        font-size: 3rem;
        margin: 1rem 0;
      }

      .card-description {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.5rem;
      }

      .card-dimensions {
        font-size: 0.85rem;
        color: #999;
        font-family: monospace;
      }

      .stats-panel, .info-panel {
        background: #f5f5f5;
        border-radius: 12px;
        padding: 1.5rem;
      }

      .stats-panel h3, .info-panel h3 {
        font-size: 1.3rem;
        color: #ff6b00;
        margin-bottom: 1rem;
      }

      .stat-row {
        display: grid;
        grid-template-columns: 140px 1fr 40px;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
      }

      .stat-label {
        color: #555;
        font-weight: 500;
      }

      .stat-bar {
        font-family: monospace;
        color: #ff6b00;
        letter-spacing: 2px;
      }

      .stat-value {
        text-align: right;
        font-weight: bold;
        color: #333;
      }

      .stadium-description {
        font-size: 1rem;
        color: #666;
        margin-bottom: 1rem;
      }

      .dimensions-display {
        display: flex;
        justify-content: space-around;
        margin-top: 1rem;
      }

      .dimension-item {
        text-align: center;
      }

      .dimension-label {
        display: block;
        font-size: 0.85rem;
        color: #888;
        margin-bottom: 0.25rem;
      }

      .dimension-value {
        display: block;
        font-size: 1.2rem;
        font-weight: bold;
        color: #ff6b00;
      }

      .button-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .start-button {
        flex: 1;
        padding: 1.5rem;
        font-size: 1.5rem;
        font-weight: bold;
        background: linear-gradient(135deg, #ff6b00 0%, #ff8c3a 100%);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
      }

      .start-button:hover:not(:disabled) {
        background: linear-gradient(135deg, #ff8c3a 0%, #ffa366 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 107, 0, 0.4);
      }

      .start-button:disabled {
        background: #ccc;
        cursor: not-allowed;
        box-shadow: none;
      }

      .secondary-button {
        flex: 1;
        padding: 1.5rem;
        font-size: 1.2rem;
        font-weight: bold;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }

      .secondary-button:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
      }

      .unlock-hint {
        text-align: center;
        margin-top: 1.5rem;
        font-size: 1rem;
        color: #666;
        font-style: italic;
      }

      @media (max-width: 768px) {
        .pregame-content {
          padding: 1.5rem;
        }

        .pregame-title {
          font-size: 2rem;
        }

        .selection-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }

        .stat-row {
          grid-template-columns: 120px 1fr 35px;
          font-size: 0.85rem;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
